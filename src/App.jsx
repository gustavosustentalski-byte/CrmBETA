// src/App.jsx
import "react-calendar/dist/Calendar.css"; // *** IMPORTAÇÃO DO CSS DO CALENDÁRIO NO TOPO ABSOLUTO ***
import React, { useEffect, useState } from "react";
import Calendar from "react-calendar"; // Importa a biblioteca de calendário


/*
  Sustentalski CRM — Protótipo v2.2 (com CRM, histórico e ajustes solicitados)
  - Nova aba: CRM (cadastro de clientes + histórico integrado Agenda/Follow-up)
  - Estratégia Semanal: "Campanha" no lugar de "Abordagem"; "Produto ideal" em múltipla escolha
  - Checkboxes atualizados: E-mail e Reunião (substituem GD e RECIEE)
  - Modal de Análise Automática (interface mantida e preparada para IA por cliente)
  - Dados persistidos no localStorage (protótipo local)
  - NOVIDADE: Visualização em calendário na aba Agenda (como uma janela/modal)
  - NOVIDADE: Tela de Login e Registro inicial.

  Instruções: substitua seu arquivo src/App.jsx por este conteúdo, salve e rode `npm run dev`.
  LEMBRE-SE DE INSTALAR 'react-calendar': npm install react-calendar
*/

////////////////////
// CONFIG
////////////////////
// Chave de teste local (NÃO deixar em produção no frontend)
const GEMINI_API_KEY = "COLE_SUA_CHAVE_AQUI";
const GEMINI_MODEL = "gemini-2.5-pro";

////////////////////
// tentativa de carregar SDK (apenas se for usado em ambiente Node/electron)
////////////////////
let GoogleGenerativeAI;
try {
  // eslint-disable-next-line no-undef
  GoogleGenerativeAI = require("@google/generative-ai").GoogleGenerativeAI;
} catch (e) {
  GoogleGenerativeAI = null;
}

////////////////////
// localStorage keys
////////////////////
const LS_KEYS = {
  strategies: "sust_v2_strategies",
  agenda: "sust_v2_agenda",
  followups: "sust_v2_followups",
  analyses: "sust_v2_analyses",
  clients: "sust_v2_clients",
  users: "sust_v2_users", // Nova chave para usuários
  loggedInUser: "sust_v2_loggedInUser", // Nova chave para usuário logado
};

const PALETTE = {
  greenDark: "#0A6847",
  blueDark: "#0B3A66",
  greenLight: "#7FD19F",
  white: "#FFFFFF",
  grayLight: "#F7F8FA",
  grayMedium: "#E6E9EE",
  text: "#0F1724",
  redError: "#EF4444", // Adicionada cor para mensagens de erro
};

const uid = (p = "id") => `${p}_${Math.random().toString(36).slice(2, 9)}`;

function useLocalState(key, initial) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);
  return [state, setState];
}

function formatBR(value) {
  const n = Number(value || 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/* ---------- Icons ---------- */
const Icon = ({ name, size = 18 }) => {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" };
  switch (name) {
    case "download":
      return (
        <svg {...common}><path d="M12 3v12" stroke={PALETTE.blueDark} strokeWidth="1.6" strokeLinecap="round"/><path d="M8 11l4 4 4-4" stroke={PALETTE.blueDark} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><rect x="4" y="18" width="16" height="2" rx="1" fill={PALETTE.blueDark}/></svg>
      );
    case "upload":
      return (
        <svg {...common}><path d="M12 21V9" stroke={PALETTE.blueDark} strokeWidth="1.6" strokeLinecap="round"/><path d="M8 13l4-4 4 4" stroke={PALETTE.blueDark} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><rect x="4" y="3" width="16" height="4" rx="1" fill={PALETTE.blueDark}/></svg>
      );
    case "ai":
      return (
        <svg {...common}><path d="M12 2v4" stroke={PALETTE.greenDark} strokeWidth="1.6" strokeLinecap="round"/><circle cx="12" cy="12" r="7" stroke={PALETTE.greenLight} strokeWidth="1.6"/><path d="M8 12h8" stroke={PALETTE.greenDark} strokeWidth="1.6" strokeLinecap="round"/></svg>
      );
    case "logout":
      return (
        <svg {...common}><path d="M17 16l4-4-4-4M21 12H9" stroke={PALETTE.blueDark} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 4H7a4 4 0 00-4 4v8a4 4 0 004 4h2" stroke={PALETTE.blueDark} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
      );
    default:
      return <svg {...common}><circle cx="12" cy="12" r="9" stroke={PALETTE.blueDark} strokeWidth="1.6"/></svg>;
  }
};

/* ---------- Main App ---------- */
export default function App() {
  const [tab, setTab] = useState("crm"); // abrir por padrão na CRM
  const [strategies, setStrategies] = useLocalState(LS_KEYS.strategies, []);
  const [agenda, setAgenda] = useLocalState(LS_KEYS.agenda, []);
  const [followups, setFollowups] = useLocalState(LS_KEYS.followups, []);
  const [analyses, setAnalyses] = useLocalState(LS_KEYS.analyses, []);
  const [clients, setClients] = useLocalState(LS_KEYS.clients, []);

  // NOVO: Estados para Autenticação
  const [users, setUsers] = useLocalState(LS_KEYS.users, {}); // Armazena { username: password }
  const [loggedInUser, setLoggedInUser] = useLocalState(LS_KEYS.loggedInUser, null); // Armazena o username do usuário logado
  const [authError, setAuthError] = useState(""); // Para mensagens de erro de login/registro

  const [query, setQuery] = useState("");

  // Derived
  const totalIndications = followups.length;
  const closed = followups.filter((f) => f.status === "fechou");
  const closedCount = closed.length;
  const conversionRate = totalIndications === 0 ? 0 : Math.round((closedCount / totalIndications) * 1000) / 10;
  const totalEstimated = followups.reduce((s, f) => s + Number(f.estimatedValue || 0), 0);
  const totalCommission = followups.reduce((s, f) => s + (Number(f.estimatedValue || 0) * Number(f.commissionPercent || 0) / 100), 0);

  // modal analysis
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisTextPreview, setAnalysisTextPreview] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");

  // export/import
  const exportAll = () => {
    const payload = { strategies, agenda, followups, analyses, clients, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sustentalski_export_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const importFile = async (f) => {
    try {
      const text = await f.text();
      const data = JSON.parse(text);
      if (data.strategies) setStrategies(data.strategies);
      if (data.agenda) setAgenda(data.agenda);
      if (data.followups) setFollowups(data.followups);
      if (data.analyses) setAnalyses(data.analyses);
      if (data.clients) setClients(data.clients);
      alert("Importação concluída.");
    } catch (e) {
      console.error(e);
      alert("Arquivo inválido.");
    }
  };

  // NOVO: Funções de autenticação
  const handleLogin = (username, password) => {
    setAuthError(""); // Limpa erros anteriores
    if (users[username] && users[username] === password) {
      setLoggedInUser(username);
      // alert(`Bem-vindo, ${username}!`); // Opcional
    } else {
      setAuthError("Nome de usuário ou senha incorretos.");
    }
  };

  const handleRegister = (username, password) => {
    setAuthError(""); // Limpa erros anteriores
    if (users[username]) {
      setAuthError("Nome de usuário já existe.");
      return;
    }
    if (username.length < 3 || password.length < 3) { // Validação simples
      setAuthError("Nome de usuário e senha devem ter pelo menos 3 caracteres.");
      return;
    }
    setUsers(prevUsers => ({ ...prevUsers, [username]: password }));
    setLoggedInUser(username); // Loga o usuário automaticamente após o registro
    // alert(`Usuário ${username} registrado e logado com sucesso!`); // Opcional
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setAuthError("");
    setTab("crm"); // Volta para a aba CRM ao deslogar
  };

  // Se não estiver logado, exibe a tela de autenticação
  if (!loggedInUser) {
    return (
      <div style={styles.app}>
        <style>{globalCss()}</style>
        <AuthScreen onLogin={handleLogin} onRegister={handleRegister} errorMessage={authError} />
      </div>
    );
  }

  // Se estiver logado, exibe o CRM
  return (
    <div style={styles.app}>
      <style>{globalCss()}</style>

      <header style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={styles.logo}>Sustentalski</div>
          <div style={styles.subtitle}>CRM • Indicadores</div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={styles.metric}><div style={{ fontSize: 12, color: "#6b7280" }}>Indicações</div><div style={{ fontWeight: 700 }}>{totalIndications}</div></div>
          <div style={styles.metric}><div style={{ fontSize: 12, color: "#6b7280" }}>Fechamentos</div><div style={{ fontWeight: 700 }}>{closedCount}</div></div>
          <div style={styles.metric}><div style={{ fontSize: 12, color: "#6b7280" }}>Taxa</div><div style={{ fontWeight: 700 }}>{conversionRate}%</div></div>

          <button style={styles.iconButton} onClick={exportAll} title="Exportar dados"><Icon name="download" /></button>

          <label style={{ ...styles.iconButton, cursor: "pointer" }} title="Importar dados">
            <input type="file" accept="application/json" style={{ display: "none" }} onChange={(e) => e.target.files && e.target.files[0] && importFile(e.target.files[0])} />
            <Icon name="upload" />
          </label>

          <button style={{ ...styles.iconButton, display: "flex", alignItems: "center", gap: 8 }} title="Análise automática" onClick={() => setAnalysisModalOpen(true)}>
            <Icon name="ai" /> <span style={{ fontSize: 13 }}>Análise automática</span>
          </button>

          {/* NOVO: Botão de Logout */}
          <button style={styles.iconButton} onClick={handleLogout} title="Sair">
            <Icon name="logout" />
          </button>
        </div>
      </header>

      <nav style={styles.nav}>
        <button onClick={() => setTab("crm")} style={tab === "crm" ? styles.tabActive : styles.tab}> 💼 CRM</button>
        <button onClick={() => setTab("strategy")} style={tab === "strategy" ? styles.tabActive : styles.tab}> 🗂️ Estrat. Semanal</button>
        <button onClick={() => setTab("agenda")} style={tab === "agenda" ? styles.tabActive : styles.tab}> 📅 Agenda</button>
        <button onClick={() => setTab("followup")} style={tab === "followup" ? styles.tabActive : styles.tab}> 📞 Follow-up</button>

        <div style={{ marginLeft: "auto" }}>
          <input placeholder="Pesquisar por nome, condomínio, nota..." value={query} onChange={(e) => setQuery(e.target.value)} style={styles.search} />
        </div>
      </nav>

      <main style={styles.main}>
        {tab === "crm" && <CRMPage agenda={agenda} followups={followups} clients={clients} setClients={setClients} />}
        {tab === "strategy" && <StrategyArea list={strategies} setList={setStrategies} query={query} />}
        {tab === "agenda" && <AgendaArea items={agenda} setItems={setAgenda} query={query} />}
        {tab === "followup" && <FollowupArea items={followups} setItems={setFollowups} agenda={agenda} query={query} totals={{ totalEstimated, totalCommission, conversionRate, closedCount }} />}

        {analysisModalOpen && (
          <AnalysisModal
            onClose={() => { setAnalysisModalOpen(false); setAnalysisTextPreview(""); setSelectedFileName(""); }}
            // Removida a lógica de chamada da API Gemini e extração de texto para simplificar.
            // Para reativar, você precisaria de uma implementação de `extractTextFromFile` e `callGeminiAnalyze`.
            // Por enquanto, apenas fechará o modal.
            onUploadAndAnalyze={async (file) => {
                alert("A análise de IA está desativada no protótipo para este arquivo. Implemente as funções 'extractTextFromFile' e 'callGeminiAnalyze' para ativá-la.");
                setAnalysisLoading(false);
            }}
            analyses={analyses}
            loading={analysisLoading}
            previewText={analysisTextPreview}
            selectedFileName={selectedFileName}
            onDeleteAnalysis={(id) => setAnalyses((c) => c.filter(a => a.id !== id))}
          />
        )}
      </main>

      <footer style={styles.footer}>
        <div>Protótipo • Dados no navegador</div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>Sustentalski — indicador → ação → fechamento</div>
      </footer>
    </div>
  );
}

/* ===========================================================
   Components: AuthScreen, AnalysisModal, CRMPage, StrategyArea, AgendaArea, FollowupArea
   =========================================================== */

/* ---------- AuthScreen (NOVO COMPONENTE) ---------- */
function AuthScreen({ onLogin, onRegister, errorMessage }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleAuthSubmit = (e) => {
    e.preventDefault(); // Evita o recarregamento da página
    if (isRegistering) {
      if (password !== confirmPassword) {
        alert('As senhas não coincidem!');
        return;
      }
      onRegister(username, password);
    } else {
      onLogin(username, password);
    }
  };

  return (
    <div style={authStyles.container}>
      <div style={authStyles.card}>
        <h2 style={authStyles.title}>{isRegistering ? 'Cadastre-se' : 'Entrar'}</h2>
        {errorMessage && <p style={authStyles.error}>{errorMessage}</p>}
        <form onSubmit={handleAuthSubmit} style={authStyles.form}>
          <input
            type="text"
            placeholder="Nome de usuário"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={authStyles.input}
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={authStyles.input}
            required
          />
          {isRegistering && (
            <input
              type="password"
              placeholder="Confirme a senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={authStyles.input}
              required
            />
          )}
          <button type="submit" style={authStyles.primaryBtn}>
            {isRegistering ? 'Registrar' : 'Entrar'}
          </button>
        </form>
        <button onClick={() => {
          setIsRegistering(!isRegistering);
          setUsername('');
          setPassword('');
          setConfirmPassword('');
        }} style={authStyles.secondaryBtn}>
          {isRegistering ? 'Já tem uma conta? Faça login' : 'Não tem conta? Cadastre-se'}
        </button>
      </div>
    </div>
  );
}

/* ---------- Analysis Modal ---------- */
function AnalysisModal({ onClose, onUploadAndAnalyze, analyses, loading, previewText, selectedFileName, onDeleteAnalysis }) {
  const [file, setFile] = useState(null);

  return (
    <div style={modalStyles.backdrop}>
      <div style={modalStyles.modal}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>✨ Análise automática (Gemini)</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={styles.smallBtn} onClick={onClose}>Fechar</button>
          </div>
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
          <div style={styles.card}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <input id="fileInput" type="file" onChange={(e) => setFile(e.target.files && e.target.files[0])} />
              <button style={styles.primaryBtn} disabled={!file || loading} onClick={() => file && onUploadAndAnalyze(file)}>{loading ? "Processando..." : "Enviar e analisar"}</button>
              <div style={{ marginLeft: "auto", color: "#6b7280" }}>{selectedFileName || "Nenhum arquivo selecionado"}</div>
            </div>
            <small style={{ display: "block", marginTop: 8, color: "#6b7280" }}>Aceita: txt, csv, json. Para docx/pdf/xlsx, instale bibliotecas opcionais ou converta para txt antes de enviar.</small>
          </div>

          <div style={styles.card}>
            <strong>Análises salvas</strong>
            {analyses.length === 0 ? <div style={styles.empty}>Nenhuma análise salva.</div> : (
              <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                {analyses.map(a => (
                  <div key={a.id} style={styles.cardSmall}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div>
                        <strong>{a.fileName}</strong>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>{new Date(a.createdAt).toLocaleString()}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button style={styles.iconSmall} onClick={() => navigator.clipboard?.writeText(a.content)}>📋</button>
                        <button style={styles.iconSmall} onClick={() => { if (confirm("Remover análise?")) onDeleteAnalysis(a.id); }}>🗑️</button>
                      </div>
                    </div>
                    <div style={{ marginTop: 8 }}>{a.content.slice(0, 400)}{a.content.length > 400 ? "…" : ""}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {previewText ? (
            <div style={styles.card}>
              <strong>Última análise ({selectedFileName})</strong>
              <div style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{previewText}</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ---------- CRM Page ---------- */
function CRMPage({ agenda, followups, clients, setClients }) {
  const [form, setForm] = useState({ nome: "", endereco: "", telefone: "", email: "", redes: "", aniversario: "", empresa: "", cargo: "", abordagem: "" });
  const [lista, setLista] = useLocalState(LS_KEYS.clients, clients || []);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    // keep parent clients in sync if provided
    if (setClients) setClients(lista);
  }, [lista]);

  const salvar = () => {
    if (!form.nome) return alert("Preencha o nome.");
    const novo = { ...form, id: uid("client"), createdAt: new Date().toISOString() };
    setLista((c) => [novo, ...c]);
    setForm({ nome: "", endereco: "", telefone: "", email: "", redes: "", aniversario: "", empresa: "", cargo: "", abordagem: "" });
  };

  const historico = (nome) => {
    const agendaCliente = agenda.filter((a) => a.name && a.name.toLowerCase().includes(nome.toLowerCase()));
    const followCliente = followups.filter((f) => f.contactName && f.contactName.toLowerCase().includes(nome.toLowerCase()));
    return [...agendaCliente.map(a => ({ tipo: "Agenda", descricao: a.notes || "Sem notas", data: a.datetime || a.createdAt })), ...followCliente.map(f => ({ tipo: "Follow-up", descricao: f.notes || "Sem notas", data: f.lastContactDate || f.createdAt }))].sort((a,b)=> new Date(b.data) - new Date(a.data));
  };

  return (
    <section>
      <h2 style={styles.h2}>💼 CRM</h2>
      <div style={styles.card}>
        <div style={styles.grid}>
          <input placeholder="Nome" value={form.nome} onChange={(e)=>setForm({...form, nome:e.target.value})} />
          <input placeholder="Endereço" value={form.endereco} onChange={(e)=>setForm({...form, endereco:e.target.value})} />
          <input placeholder="Telefone" value={form.telefone} onChange={(e)=>setForm({...form, telefone:e.target.value})} />
          <input placeholder="E-mail" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} />
          <input placeholder="Perfis de redes sociais" value={form.redes} onChange={(e)=>setForm({...form, redes:e.target.value})} />
          <input type="date" placeholder="Data de aniversário" value={form.aniversario} onChange={(e)=>setForm({...form, aniversario:e.target.value})} />
          <input placeholder="Empresa" value={form.empresa} onChange={(e)=>setForm({...form, empresa:e.target.value})} />
          <input placeholder="Cargo" value={form.cargo} onChange={(e)=>setForm({...form, cargo:e.target.value})} />
          <input placeholder="Abordagem" value={form.abordagem} onChange={(e)=>setForm({...form, abordagem:e.target.value})} />
        </div>

        <div style={{ marginTop: 10 }}>
          <button style={styles.primaryBtn} onClick={salvar}>＋ Salvar cliente</button>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        {lista.length === 0 ? (
          <div style={styles.empty}>Nenhum cliente cadastrado.</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {lista.map((c) => (
              <div key={c.id} style={styles.cardSmall}>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <div>
                    <strong>{c.nome}</strong>
                    <div style={{ fontSize: 13, color: "#374151" }}>{c.empresa} • {c.cargo}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={styles.smallBtn} onClick={() => setSelected(c)}>Ver histórico</button>
                    <button style={styles.smallBtn} onClick={() => {
                      // botão preparado para IA por cliente (futuro)
                      alert('Funcionalidade de IA por cliente preparada — implementar backend para ativar.');
                    }}>Analisar cliente (IA)</button>
                  </div>
                </div>
                <div style={{ marginTop:6, color:"#6b7280" }}>{c.email} • {c.telefone}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div style={modalStyles.backdrop}>
          <div style={modalStyles.modal}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3>📜 Histórico de {selected.nome}</h3>
              <button style={styles.smallBtn} onClick={()=>setSelected(null)}>Fechar</button>
            </div>

            <div style={{ marginTop:12 }}>
              <div style={styles.card}>
                <strong>Dados</strong>
                <div style={{ marginTop:8 }}>{selected.endereco}</div>
                <div style={{ marginTop:6 }}>{selected.email} • {selected.telefone}</div>
                <div style={{ marginTop:6, color:'#6b7280' }}>{selected.redes}</div>
              </div>

              <div style={{ marginTop:12 }}>
                <strong>Interações (Agenda + Follow-up)</strong>
                {historico(selected.nome).length === 0 ? (
                  <div style={styles.empty}>Nenhuma interação encontrada.</div>
                ) : (
                  <div style={{ display:'grid', gap:8, marginTop:8 }}>
                    {historico(selected.nome).map((h,i)=>(
                      <div key={i} style={styles.cardSmall}>
                        <div style={{ display:'flex', justifyContent:'space-between' }}>
                          <div>
                            <div style={{ fontWeight:700 }}>{h.tipo}</div>
                            <div style={{ marginTop:4 }}>{h.descricao}</div>
                          </div>
                          <div style={{ color:'#6b7280' }}>{new Date(h.data).toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ---------- Strategy Area (modificada) ---------- */
function StrategyArea({ list, setList, query }) {
  const [form, setForm] = useState({ weekRange: "", grupo: "", names: "", produto: "", abordagem: "", indicacoes: "", types: { email:false, reuniao:false, whatsapp:false, telefonema:false, visita:false }, notes: "" });

  const add = () => {
    if (!form.weekRange) return alert("Preencha a semana.");
    setList((c) => [{ ...form, id: uid("s"), createdAt: new Date().toISOString() }, ...c]);
    setForm({ weekRange: "", grupo: "", names: "", produto: "", abordagem: "", indicacoes: "", types: { email:false, reuniao:false, whatsapp:false, telefonema:false, visita:false }, notes: "" });
  };
  const remove = (id) => setList((c) => c.filter((i) => i.id !== id));
  const filtered = list.filter((s) => [s.weekRange, s.grupo, s.names, s.produto, s.abordagem, s.indicacoes, s.notes].join(" ").toLowerCase().includes(query.toLowerCase()));

  return (
    <section>
      <h2 style={styles.h2}>📋 Estratégia Semanal</h2>
      <div style={styles.card}>
        <div style={styles.grid}>
          <input placeholder="Semana (ex: 06/10 - 10/10)" value={form.weekRange} onChange={(e)=>setForm({...form, weekRange:e.target.value})} />
          <input placeholder="Grupo / Segmento" value={form.grupo} onChange={(e)=>setForm({...form, grupo:e.target.value})} />
          <input placeholder="Nome(s) / Empresa(s)" value={form.names} onChange={(e)=>setForm({...form, names:e.target.value})} />

          {/* Produto ideal: múltipla escolha */}
          <select
            value={form.produto}
            onChange={(e)=>setForm({...form, produto:e.target.value})}
            style={{
              padding: "10px",
              borderRadius: "10px",
              border: "1px solid #E6E9EE",
              background: "#fff",
              fontSize: "14px",
              color: "#0F1724",
              fontFamily: "Aptos, Inter, system-ui",
              cursor: "pointer",
            }}
          >
            <option value="">Selecione o produto ideal</option>
            <option value="RECIEE">RECIEE</option>
            <option value="RECIAG">RECIAG</option>
            <option value="GD">GD</option>
            <option value="ML">ML</option>
            <option value="ELETROPOSTO">ELETROPOSTO</option>
          </select>

          <input placeholder="Campanha" value={form.abordagem} onChange={(e)=>setForm({...form, abordagem:e.target.value})} />
          <input placeholder="Indicações (quem indicar)" value={form.indicacoes} onChange={(e)=>setForm({...form, indicacoes:e.target.value})} />

          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:6 }}>
              <label style={styles.checkbox}><input type="checkbox" checked={form.types.email} onChange={(e)=>setForm({...form, types:{...form.types, email:e.target.checked}})} /> E-mail</label>
              <label style={styles.checkbox}><input type="checkbox" checked={form.types.reuniao} onChange={(e)=>setForm({...form, types:{...form.types, reuniao:e.target.checked}})} /> Reunião</label>
              <label style={styles.checkbox}><input type="checkbox" checked={form.types.whatsapp} onChange={(e)=>setForm({...form, types:{...form.types, whatsapp:e.target.checked}})} /> WhatsApp</label>
              <label style={styles.checkbox}><input type="checkbox" checked={form.types.telefonema} onChange={(e)=>setForm({...form, types:{...form.types, telefonema:e.target.checked}})} /> Telefonema</label>
              <label style={styles.checkbox}><input type="checkbox" checked={form.types.visita} onChange={(e)=>setForm({...form, types:{...form.types, visita:e.target.checked}})} /> Visita</label>
            </div>
            <textarea placeholder="Observações / instruções para a equipe" rows={3} value={form.notes} onChange={(e)=>setForm({...form, notes:e.target.value})} />
          </div>
        </div>

        <div style={{ display:"flex", gap:8, marginTop:10, alignItems:"center" }}>
          <button style={styles.primaryBtn} onClick={add}>＋ Criar estratégia</button>
          <small style={{ color:"#6b7280" }}>Crie 1–3 focos por semana e transforme em ações na Agenda.</small>
        </div>
      </div>

      <div style={{ marginTop:12 }}>
        {filtered.length === 0 ? <div style={styles.empty}>Nenhuma estratégia cadastrada.</div> : (
          <div style={{ display:"grid", gap:8 }}>
            {filtered.map((s) => (
              <div key={s.id} style={styles.cardSmall}>
                <div style={{display:"flex", justifyContent:"space-between"}}>
                  <strong>{s.weekRange} • {s.grupo || "—"}</strong>
                  <div style={{display:"flex", gap:8}}>
                    <button style={styles.iconSmall} onClick={() => navigator.clipboard?.writeText(JSON.stringify(s))}>📋</button>
                    <button style={styles.iconSmall} onClick={() => remove(s.id)}>🗑️</button>
                  </div>
                </div>
                <div style={{ marginTop:6 }}>{s.names}</div>
                <div style={{ marginTop:6, color:"#374151" }}>Produto: {s.produto || "—"} • Campanha: {s.abordagem || "—"}</div>
                <div style={{ marginTop:6, color:"#6b7280" }}>Indicações: {s.indicacoes || "—"}</div>
                <div style={{ marginTop:8 }}>{s.notes}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------- Agenda Area ---------- */
function AgendaArea({ items, setItems, query }) {
  const [form, setForm] = useState({
    name:"", relatedPerson:"", relationNote:"", company:"", condominium:"", phone:"", email:"", datetime:"", contactType:"ligação", priority:"média", source:"", notes:""
  });
  const [showCalendarView, setShowCalendarView] = useState(false); // NOVO ESTADO para controlar a visualização do calendário

  const add = () => {
    if (!form.name) return alert("Preencha o nome do contato.");
    const obj = { ...form, id: uid("a"), createdAt: new Date().toISOString(), done:false };
    setItems((c) => [obj, ...c]);
    setForm({ name:"", relatedPerson:"", relationNote:"", company:"", condominium:"", phone:"", email:"", datetime:"", contactType:"ligação", priority:"média", source:"", notes:"" });
  };
  const remove = (id) => setItems((c) => c.filter((i)=>i.id !== id));
  const toggle = (id) => setItems((c) => c.map((i)=> i.id === id ? { ...i, done: !i.done } : i ));
  const filtered = items.filter((it) => [it.name, it.relatedPerson, it.company, it.condominium, it.phone, it.email, it.notes, it.source].join(" ").toLowerCase().includes(query.toLowerCase()));

  return (
    <section>
      <h2 style={styles.h2}>📅 Agenda</h2>
      <div style={styles.card}>
        <div style={styles.grid}>
          <input placeholder="Nome do contato (quem você aborda)" value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} />
          <input placeholder="Pessoa relacionada (ex: marido de Maria - decisor)" value={form.relatedPerson} onChange={(e)=>setForm({...form, relatedPerson:e.target.value})} />
          <input placeholder="Observação de relação (ex: mora apto 42)" value={form.relationNote} onChange={(e)=>setForm({...form, relationNote:e.target.value})} />
          <input placeholder="Empresa / Local" value={form.company} onChange={(e)=>setForm({...form, company:e.target.value})} />
          <input placeholder="Condomínio / Bairro" value={form.condominium} onChange={(e)=>setForm({...form, condominium:e.target.value})} />
          <input placeholder="Telefone (WhatsApp)" value={form.phone} onChange={(e)=>setForm({...form, phone:e.target.value})} />
          <input placeholder="Email (opcional)" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} />
          <input type="datetime-local" value={form.datetime} onChange={(e)=>setForm({...form, datetime:e.target.value})} />
          <select value={form.contactType} onChange={(e)=>setForm({...form, contactType:e.target.value})}><option value="ligação">Ligação</option><option value="whatsapp">WhatsApp</option><option value="visita">Visita</option><option value="reunião">Reunião</option><option value="email">Email</option></select>
          <select value={form.priority} onChange={(e)=>setForm({...form, priority:e.target.value})}><option value="alta">Alta</option><option value="média">Média</option><option value="baixa">Baixa</option></select>
          <input placeholder="Fonte / Indicador (ex: João - grupo X)" value={form.source} onChange={(e)=>setForm({...form, source:e.target.value})} />
          <textarea placeholder="Notas / Ações (ex: apresentar proposta)" rows={3} value={form.notes} onChange={(e)=>setForm({...form, notes:e.target.value})} />
        </div>

        <div style={{ display:"flex", gap:8, marginTop:10 }}>
          <button style={styles.primaryBtn} onClick={add}>＋ Agendar</button>
          {/* BOTÃO para abrir a visualização em calendário */}
          <button style={styles.smallBtn} onClick={() => setShowCalendarView(true)}>🗓️ Ver em calendário</button>
          <small style={{ alignSelf:"center", color:"#6b7280" }}>Use "Pessoa relacionada" quando o decisor for outra pessoa.</small>
        </div>
      </div>

      <div style={{ marginTop:12 }}>
        {filtered.length === 0 ? <div style={styles.empty}>Nenhuma ação agendada.</div> : (
          <div style={{ display:"grid", gap:8 }}>
            {filtered.map((it) => (
              <div key={it.id} style={{ ...styles.cardSmall, borderLeft: it.priority === "alta" ? `4px solid ${PALETTE.greenDark}` : "4px solid transparent" }}>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <div>
                    <strong>{it.name}</strong>{it.relatedPerson ? <span style={{ color:"#6b7280", fontSize:13 }}> • {it.relatedPerson}</span> : null}
                    <div style={{ fontSize:13, color:"#374151" }}>{it.company || it.condominium} • {it.contactType} • {it.phone}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:13, color:"#6b7280" }}>{it.datetime ? new Date(it.datetime).toLocaleString() : "(sem data)"}</div>
                    <div style={{ display:"flex", gap:6, marginTop:6, justifyContent:"flex-end" }}>
                      <button onClick={() => toggle(it.id)} style={styles.iconSmall}>{it.done ? "✔️" : "⭕"}</button>
                      <button onClick={() => remove(it.id)} style={styles.iconSmall}>🗑️</button>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop:8 }}>{it.notes}</div>
                <div style={{ marginTop:8, fontSize:13, color:"#6b7280" }}>Fonte: {it.source || "—"}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Renderiza o modal de calendário se showCalendarView for true */}
      {showCalendarView && (
        <CalendarView
          events={items} // Passa todos os itens da agenda como eventos
          onClose={() => setShowCalendarView(false)} // Função para fechar o modal
        />
      )}
    </section>
  );
}

/* ---------- Followup Area ---------- */
function FollowupArea({ items, setItems, agenda, query, totals }) {
  const [form, setForm] = useState({ contactName:"", relatedPerson:"", relationNote:"", status:"aguardando", lastContactDate:"", reason:"", nextSteps:"", relatedContacts:"", notes:"", estimatedValue:"", commissionPercent:10 });

  const add = () => {
    if (!form.contactName) return alert("Preencha o nome do contato.");
    const obj = { ...form, id: uid("f"), createdAt: new Date().toISOString() };
    setItems((c) => [obj, ...c]);
    setForm({ contactName:"", relatedPerson:"", relationNote:"", status:"aguardando", lastContactDate:"", reason:"", nextSteps:"", relatedContacts:"", notes:"", estimatedValue:"", commissionPercent:10 });
  };
  const remove = (id) => setItems((c) => c.filter((i)=>i.id !== id));
  const update = (id, patch) => setItems((c) => c.map((i)=> i.id === id ? { ...i, ...patch } : i ));
  const filtered = items.filter((it) => [it.contactName, it.relatedPerson, it.reason, it.nextSteps, it.notes, it.relatedContacts].join(" ").toLowerCase().includes(query.toLowerCase()));

  const totalInd = items.length;
  const closed = items.filter((f) => f.status === "fechou").length;
  const conv = totalInd === 0 ? 0 : Math.round((closed / totalInd) * 1000) / 10;
  const totalEst = items.reduce((s, f) => s + Number(f.estimatedValue || 0), 0);
  const totalCom = items.reduce((s, f) => s + (Number(f.estimatedValue || 0) * Number(f.commissionPercent || 0) / 100), 0);

  return (
    <section>
      <h2 style={styles.h2}>📞 Follow-up de Indicações</h2>

      <div style={styles.card}>
        <div style={styles.grid}>
          <input placeholder="Nome do contato (indicado)" value={form.contactName} onChange={(e)=>setForm({...form, contactName:e.target.value})} />
          <input placeholder="Pessoa relacionada (ex: marido de Maria)" value={form.relatedPerson} onChange={(e)=>setForm({...form, relatedPerson:e.target.value})} />
          <input placeholder="Observação da relação (ex: decisor mora apto 42)" value={form.relationNote} onChange={(e)=>setForm({...form, relationNote:e.target.value})} />
          <select value={form.status} onChange={(e)=>setForm({...form, status:e.target.value})}><option value="aguardando">Aguardando</option><option value="fechou">Fechou</option><option value="nao_fechou">Não fechou</option><option value="retorno">Retorno futuro</option></select>
          <input type="date" value={form.lastContactDate} onChange={(e)=>setForm({...form, lastContactDate:e.target.value})} />
          <input placeholder="Motivo / detalhe" value={form.reason} onChange={(e)=>setForm({...form, reason:e.target.value})} />
          <input placeholder="Próximos passos (ex: enviar proposta dd/mm)" value={form.nextSteps} onChange={(e)=>setForm({...form, nextSteps:e.target.value})} />
          <input placeholder="Contatos relacionados (síndico, primo...)" value={form.relatedContacts} onChange={(e)=>setForm({...form, relatedContacts:e.target.value})} />
          <input placeholder="Valor estimado (R$)" value={form.estimatedValue} onChange={(e)=>setForm({...form, estimatedValue:e.target.value})} />
          <input placeholder="Comissão % (ex: 10)" value={form.commissionPercent} onChange={(e)=>setForm({...form, commissionPercent:e.target.value})} />
          <textarea placeholder="Notas complementares" rows={3} value={form.notes} onChange={(e)=>setForm({...form, notes:e.target.value})} />
        </div>

        <div style={{ display:"flex", gap:8, marginTop:10 }}>
          <button style={styles.primaryBtn} onClick={add}>＋ Registrar follow-up</button>
          <small style={{ alignSelf:"center", color:"#6b7280" }}>Preencha valor estimado e comissão por contato para os relatórios.</small>
        </div>
      </div>

      <div style={{ marginTop: 12, display:"grid", gap:10 }}>
        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          <div style={styles.reportCard}><div style={{fontSize:12, color:"#6b7280"}}>Indicações</div><div style={{fontWeight:700}}>{totalInd}</div></div>
          <div style={styles.reportCard}><div style={{fontSize:12, color:"#6b7280"}}>Fechamentos</div><div style={{fontWeight:700}}>{closed}</div></div>
          <div style={styles.reportCard}><div style={{fontSize:12, color:"#6b7280"}}>Taxa</div><div style={{fontWeight:700}}>{conv}%</div></div>
          <div style={styles.reportCard}><div style={{fontSize:12, color:"#6b7280"}}>Valor estimado</div><div style={{fontWeight:700}}>{formatBR(totalEst)}</div></div>
          <div style={styles.reportCard}><div style={{fontSize:12, color:"#6b7280"}}>Comissão total</div><div style={{fontWeight:700}}>{formatBR(totalCom)}</div></div>
        </div>

        {filtered.length === 0 ? <div style={styles.empty}>Nenhum follow-up registrado.</div> : (
          <div style={{ display:"grid", gap:8 }}>
            {filtered.map((it) => (
              <div key={it.id} style={styles.cardSmall}>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <div>
                    <strong>{it.contactName}</strong>{it.relatedPerson ? <span style={{ color:"#6b7280", fontSize:13 }}> • {it.relatedPerson}</span> : null}
                    <div style={{ fontSize:13, color:"#374151" }}>{it.relatedContacts || "—"}</div>
                  </div>

                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:13, color:"#6b7280" }}>{it.lastContactDate || new Date(it.createdAt).toLocaleDateString()}</div>
                    <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:6 }}>
                      <button style={styles.iconSmall} onClick={() => navigator.clipboard?.writeText(JSON.stringify(it))}>📋</button>
                      <button style={styles.iconSmall} onClick={() => { if (confirm("Remover registro?")) remove(it.id); }}>🗑️</button>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop:8 }}>Status: <strong>{labelStatus(it.status)}</strong></div>
                <div style={{ marginTop:6 }}>Motivo: {it.reason || "—"}</div>
                <div style={{ marginTop:6 }}>Próx passos: {it.nextSteps || "—"}</div>

                <div style={{ marginTop:8, display:"flex", gap:12, flexWrap:"wrap", alignItems:"center" }}>
                  <div style={{ minWidth:220 }}>
                    <div style={{ fontSize:13, color:"#6b7280" }}>Valor estimado</div>
                    <div style={{ fontWeight:700 }}>{formatBR(it.estimatedValue || 0)}</div>
                  </div>
                  <div style={{ minWidth:160 }}>
                    <div style={{ fontSize:13, color:"#6b7280" }}>Comissão %</div>
                    <div style={{ fontWeight:700 }}>{it.commissionPercent || 0}%</div>
                  </div>

                  <div style={{ minWidth:200 }}>
                    <div style={{ fontSize:13, color:"#6b7280" }}>Comissão (R$)</div>
                    <div style={{ fontWeight:700 }}>{formatBR((Number(it.estimatedValue || 0) * Number(it.commissionPercent || 0)) / 100)}</div>
                  </div>

                  <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                    <button style={styles.smallBtn} onClick={() => {
                      const newValue = prompt("Editar valor estimado (R$):", it.estimatedValue || "");
                      if (newValue === null) return;
                      const newCom = prompt("Editar comissão %:", it.commissionPercent || 10);
                      if (newCom === null) return;
                      update(it.id, { estimatedValue: Number(newValue || 0), commissionPercent: Number(newCom || 0) });
                    }}>Editar valores</button>
                  </div>
                </div>

                <div style={{ marginTop:8, color:"#374151" }}>{it.notes}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------- util ---------- */
function labelStatus(s) {
  if (s === "fechou") return "Fechou";
  if (s === "nao_fechou") return "Não fechou";
  if (s === "retorno") return "Retorno";
  return "Aguardando";
}

/* ---------- CalendarView ---------- */
function CalendarView({ events, onClose }) {
  const [date, setDate] = useState(new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState([]);

  useEffect(() => {
    // Atualiza os eventos do dia selecionado ao abrir ou quando a data muda
    // ou quando os eventos mudam
    handleDateChange(date);
  }, [date, events]);

  const handleDateChange = (newDate) => {
    setDate(newDate);
    const dayEvents = events.filter(event => {
      if (!event.datetime) return false;
      const eventDate = new Date(event.datetime);
      // Garantir que a comparação é apenas por data, ignorando a hora
      return eventDate.toDateString() === newDate.toDateString();
    }).sort((a, b) => {
      // Ordenar por hora, se datetime for válido
      if (a.datetime && b.datetime) {
        return new Date(a.datetime).getTime() - new Date(b.datetime).getTime();
      }
      return 0; // Não altera a ordem se datetime for inválido
    });
    setSelectedDayEvents(dayEvents);
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dayHasEvents = events.some(event => {
        if (!event.datetime) return false;
        const eventDate = new Date(event.datetime);
        return eventDate.toDateString() === date.toDateString();
      });
      return dayHasEvents ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
          {/* Adiciona um pequeno ponto verde se houver eventos */}
          <div style={{ backgroundColor: PALETTE.greenDark, borderRadius: '50%', width: 6, height: 6, marginTop: 4 }}></div>
        </div>
      ) : null;
    }
  };

  return (
    <div style={modalStyles.backdrop}>
      <div style={{...modalStyles.modal, display: "flex", flexDirection: "column", gap: 12}}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3>🗓️ Agenda Visual</h3>
          <button style={styles.smallBtn} onClick={onClose}>Fechar</button>
        </div>
        
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", flex: 1 }}>
          <div style={{ flex: 1, minWidth: 280, maxWidth: "100%" }}>
            <Calendar
              key="main-calendar" // Adicionado key para garantir re-renderização se necessário
              onChange={handleDateChange}
              value={date}
              locale="pt-BR"
              calendarType="US" // Define o domingo como primeiro dia da semana
              tileContent={tileContent}
            />
          </div>

          <div style={{ flex: 1, minWidth: 280, maxHeight: 400, overflowY: "auto", padding: "0 5px" }}>
            <h4>Eventos para {date.toLocaleDateString('pt-BR')}</h4>
            {selectedDayEvents.length === 0 ? (
              <div style={styles.empty}>Nenhum evento agendado para este dia.</div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {selectedDayEvents.map((event) => (
                  <div key={event.id} style={styles.cardSmall}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong>{event.name}</strong>
                      <span style={{ fontSize: 13, color: "#6b7280" }}>
                        {event.datetime ? new Date(event.datetime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : "—"}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "#374151" }}>{event.company || event.condominium || "—"}</div>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>{event.notes || "Sem notas"}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


/* ---------- styles & global css ---------- */
const styles = {
  app: { minHeight: "100vh", background: PALETTE.grayLight, color: PALETTE.text, fontFamily: "Aptos, Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial", display: "flex", flexDirection: "column" },
  // Ajuste no header para garantir que ele esteja fixo e cubra a largura total
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    background: PALETTE.white,
    borderBottom: `1px solid ${PALETTE.grayMedium}`,
    position: "sticky",
    top: 0,
    left: 0, // Adicionado para fixar à esquerda
    right: 0, // Adicionado para fixar à direita
    zIndex: 20
  },
  logo: { fontWeight: 800, color: PALETTE.greenDark, fontSize: 18 },
  subtitle: { fontSize: 13, color: "#6b7280" },
  metric: { padding: "6px 10px", borderRadius: 10, background: "#fff", border: `1px solid ${PALETTE.grayMedium}`, textAlign: "center" },
  iconButton: { background: PALETTE.white, border: `1px solid ${PALETTE.grayMedium}`, padding: 8, borderRadius: 10, cursor: "pointer", display: "inline-flex", alignItems: "center" },
  nav: { display: "flex", gap: 8, alignItems: "center", padding: "12px 16px", borderBottom: `1px solid ${PALETTE.grayMedium}`, flexWrap: "wrap" },
  tab: { display: "flex", gap: 8, alignItems: "center", padding: "8px 12px", borderRadius: 10, border: `1px solid ${PALETTE.grayMedium}`, background: "transparent", color: PALETTE.text, cursor: "pointer" },
  tabActive: { display: "flex", gap: 8, alignItems: "center", padding: "8px 12px", borderRadius: 10, border: `1px solid ${PALETTE.greenDark}`, background: PALETTE.greenDark, color: PALETTE.white, cursor: "pointer" },
  search: { padding: "8px 12px", borderRadius: 10, border: `1px solid ${PALETTE.grayMedium}`, minWidth: 220 },
  main: { padding: 16, flex: 1, maxWidth: 1100, margin: "0 auto", width: "100%" },
  h2: { marginBottom: 8, color: PALETTE.blueDark },
  card: { background: PALETTE.white, borderRadius: 16, padding: 14, boxShadow: "0 6px 18px rgba(7,11,19,0.06)" },
  cardSmall: { background: PALETTE.white, borderRadius: 12, padding: 12, border: `1px solid ${PALETTE.grayMedium}` },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 },
  primaryBtn: { background: PALETTE.greenDark, color: PALETTE.white, padding: "10px 14px", borderRadius: 12, border: "none", cursor: "pointer", boxShadow: "0 6px 14px rgba(10,104,71,0.12)" },
  smallBtn: { padding: "8px 10px", borderRadius: 10, border: `1px solid ${PALETTE.grayMedium}`, background: PALETTE.white, cursor: "pointer" },
  iconSmall: { padding: 8, borderRadius: 8, border: `1px solid ${PALETTE.grayMedium}`, background: "transparent", cursor: "pointer" },
  empty: { padding: 12, color: "#6b7280", fontStyle: "italic" },
  footer: { padding: 12, textAlign: "center", color: "#6b7280" },
  reportCard: { background: "#fff", borderRadius: 10, padding: 10, border: `1px solid ${PALETTE.grayMedium}`, minWidth: 140, textAlign: "center" },
  checkbox: { display: "flex", alignItems: "center", gap: 6 }
};

// NOVO: Estilos para a tela de autenticação
const authStyles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: PALETTE.grayLight,
    padding: 20,
  },
  card: {
    background: PALETTE.white,
    borderRadius: 16,
    padding: 30,
    boxShadow: "0 8px 30px rgba(7,11,19,0.1)",
    width: "100%",
    maxWidth: 400,
    display: "flex",
    flexDirection: "column",
    gap: 15,
  },
  title: {
    margin: "0 0 15px 0",
    color: PALETTE.blueDark,
    textAlign: "center",
    fontSize: 24,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 15,
  },
  input: {
    padding: "12px 15px",
    borderRadius: 10,
    border: `1px solid ${PALETTE.grayMedium}`,
    fontSize: 16,
    width: "100%",
  },
  primaryBtn: {
    background: PALETTE.greenDark,
    color: PALETTE.white,
    padding: "12px 15px",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    fontSize: 16,
    fontWeight: "bold",
    boxShadow: "0 6px 14px rgba(10,104,71,0.12)",
    marginTop: 10,
  },
  secondaryBtn: {
    padding: "10px 15px",
    borderRadius: 10,
    border: `1px solid ${PALETTE.grayMedium}`,
    background: "transparent",
    color: PALETTE.text,
    cursor: "pointer",
    fontSize: 14,
    marginTop: 10,
  },
  error: {
    color: PALETTE.redError,
    textAlign: "center",
    fontSize: 14,
    marginBottom: 10,
  }
};


function globalCss() {
  return `
    * { box-sizing: border-box; }
    html, body, #root { height: 100%; margin: 0; }
    input, select, textarea, button { font-family: inherit; font-size: 14px; color: ${PALETTE.text}; }
    input, select, textarea { padding: 10px; border-radius: 10px; border: 1px solid ${PALETTE.grayMedium}; background: #fff; }
    textarea { resize: vertical; }
    button { transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease; }
    button:hover { opacity: 0.9; } /* Adicionado hover genérico para botões */
    
    /* Media queries para responsividade */
    @media (max-width: 768px) { /* Ajustado para um breakpoint mais comum para tablets/celulares */
      .grid { grid-template-columns: 1fr !important; }
      input[placeholder], textarea[placeholder] { font-size: 14px; }
      
      /* Ajusta o calendário para ocupar 100% da largura em telas menores */
      .react-calendar {
        width: 100% !important; 
        max-width: 100% !important; /* Adicionado para garantir que não ultrapasse o contêiner */
      }
    }

    /* Estilos específicos para o react-calendar, para harmonizar com o design */
    .react-calendar {
      border: 1px solid ${PALETTE.grayMedium};
      border-radius: 12px;
      font-family: inherit;
      background: ${PALETTE.white};
      padding: 8px;
      width: 100%; /* Garante que o calendário tenta preencher o espaço disponível */
      max-width: 350px; /* Limita a largura máxima para não ficar muito grande em telas largas */
      box-shadow: 0 2px 8px rgba(7,11,19,0.04); /* Sombra suave */
    }

    .react-calendar__navigation button {
      color: ${PALETTE.blueDark};
      font-weight: bold;
      min-width: 44px; /* Garante que os botões de navegação não fiquem muito pequenos */
    }

    .react-calendar__month-view__weekdays abbr {
      text-decoration: none;
      font-weight: bold;
      color: ${PALETTE.text};
    }

    .react-calendar__tile {
      padding: 8px 0;
      height: 50px; /* Altura fixa para as células */
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      font-size: 13px; /* Tamanho da fonte dos dias */
    }

    .react-calendar__tile--now {
      background: ${PALETTE.grayLight}; /* Cor de fundo para o dia atual */
      border-radius: 6px;
    }

    .react-calendar__tile--active {
      background: ${PALETTE.greenDark} !important;
      color: ${PALETTE.white};
      border-radius: 6px;
    }
    
    /* Estilo para dias que têm eventos (o pequeno ponto verde) */
    .react-calendar__tile > div {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
    }

    .react-calendar__tile:enabled:hover,
    .react-calendar__tile:enabled:focus {
      background-color: ${PALETTE.grayMedium};
      border-radius: 6px;
    }
  `;
}

/* ---------- modal styles ---------- */
const modalStyles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)", // Fundo mais escuro para maior contraste
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 60,
    overflowY: "auto", // Permite rolagem se o conteúdo do modal for grande
  },
  modal: {
    width: "92%",
    maxWidth: 980,
    minHeight: "400px", // Adicionado min-height para garantir que o modal não seja muito pequeno
    background: "#fff",
    borderRadius: 12,
    padding: 18,
    boxShadow: "0 12px 40px rgba(7,11,19,0.25)",
    maxHeight: "90vh", // Aumentado para 90vh para permitir mais espaço
    overflowY: "auto", // O conteúdo interno rola se exceder o maxHeight
  }
};