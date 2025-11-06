import React, { useEffect, useState } from "react";
import "./App.css";

const COMPANY_LOGO_URL = "https://customer-assets.emergentagent.com/job_3258037a-50a8-438f-9b4c-f96f824ad6b7/artifacts/kmm9hes8_Asset%202%403x.png";
const BACKGROUND_IMAGE_URL = "https://customer-assets.emergentagent.com/job_3258037a-50a8-438f-9b4c-f96f824ad6b7/artifacts/6lde012w_image.png";

const LS_KEYS = {
  strategies: "sust_v2_strategies",
  agenda: "sust_v2_agenda",
  followups: "sust_v2_followups",
  analyses: "sust_v2_analyses",
  clients: "sust_v2_clients",
  users: "sust_v2_users",
  loggedInUser: "sust_v2_loggedInUser",
  campaigns: "sust_v2_campaigns",
};

const PALETTE = {
  greenDark: "#0A6847",
  blueDark: "#0B3A66",
  greenLight: "#7FD19F",
  white: "#FFFFFF",
  grayLight: "#F7F8FA",
  grayMedium: "#E6E9EE",
  text: "#0F1724",
  redError: "#EF4444",
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

export default function App() {
  const [tab, setTab] = useState("crm");
  const [strategies, setStrategies] = useLocalState(LS_KEYS.strategies, []);
  const [agenda, setAgenda] = useLocalState(LS_KEYS.agenda, []);
  const [followups, setFollowups] = useLocalState(LS_KEYS.followups, []);
  const [analyses, setAnalyses] = useLocalState(LS_KEYS.analyses, []);
  const [clients, setClients] = useLocalState(LS_KEYS.clients, []);
  const [users, setUsers] = useLocalState(LS_KEYS.users, {});
  const [loggedInUser, setLoggedInUser] = useLocalState(LS_KEYS.loggedInUser, null);
  const [campaigns, setCampaigns] = useLocalState(LS_KEYS.campaigns, []);
  const [authError, setAuthError] = useState("");
  const [query, setQuery] = useState("");
  const totalIndications = followups.length;
  const closed = followups.filter((f) => f.signedContract === "SIM");
  const closedCount = closed.length;
  const conversionRate = totalIndications === 0 ? 0 : Math.round((closedCount / totalIndications) * 1000) / 10;
  const totalEstimated = followups.reduce((s, f) => s + Number(f.estimatedValue || 0), 0);
  const totalCommission = followups.reduce((s, f) => s + (Number(f.estimatedValue || 0) * Number(f.commissionPercent || 0) / 100), 0);

  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisTextPreview, setAnalysisTextPreview] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");

  const exportAll = () => {
    const payload = { strategies, agenda, followups, analyses, clients, campaigns, exportedAt: new Date().toISOString() };
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
      if (data.campaigns) setCampaigns(data.campaigns);
      alert("Importação concluída.");
    } catch (e) {
      console.error(e);
      alert("Arquivo inválido.");
    }
  };

  const handleLogin = (username, password) => {
    setAuthError("");
    if (users[username] && users[username].password === password) {
      setLoggedInUser(username);
    } else {
      setAuthError("Nome de usuário ou senha incorretos.");
    }
  };

  const handleRegister = ({ username, password, fullName, cepOrCity, cpf, email }) => {
    setAuthError("");
    if (users[username]) {
      setAuthError("Nome de usuário já existe.");
      return;
    }
    if (username.length < 3 || password.length < 3) {
      setAuthError("Nome de usuário e senha devem ter pelo menos 3 caracteres.");
      return;
    }
    if (!fullName || !cepOrCity || !cpf || !email) {
      setAuthError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
        setAuthError("Por favor, insira um e-mail válido.");
        return;
    }
    if (!/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(cpf.replace(/[^0-9]/g, ''))) {
        setAuthError("Por favor, insira um CPF válido.");
        return;
    }

    setUsers(prevUsers => ({
      ...prevUsers,
      [username]: {
        password,
        fullName,
        cepOrCity,
        cpf,
        email,
      }
    }));
    setLoggedInUser(username);
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setAuthError("");
    setTab("crm");
  };

  if (!loggedInUser) {
    return (
      <div style={styles.app}>
        <style>{globalCss()}</style>
        <AuthScreen onLogin={handleLogin} onRegister={handleRegister} errorMessage={authError} />
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <style>{globalCss()}</style>

      <header style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src={COMPANY_LOGO_URL} alt="Sustentalski Logo" style={{ height: 45, objectFit: "contain" }} />
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

          <button style={styles.iconButton} onClick={handleLogout} title="Sair">
            <Icon name="logout" />
          </button>
        </div>
      </header>

      <nav style={styles.nav}>
        <button onClick={() => setTab("crm")} style={tab === "crm" ? styles.tabActive : styles.tab}> 💼 CRM</button>
        <button onClick={() => setTab("campaigns")} style={tab === "campaigns" ? styles.tabActive : styles.tab}> 📢 Campanhas</button>
        <button onClick={() => setTab("strategy")} style={tab === "strategy" ? styles.tabActive : styles.tab}> 🗂️ Estrat. Semanal</button>
        <button onClick={() => setTab("agenda")} style={tab === "agenda" ? styles.tabActive : styles.tab}> 📅 Agenda</button>
        <button onClick={() => setTab("followup")} style={tab === "followup" ? styles.tabActive : styles.tab}> 📞 Follow-up</button>

        <div style={{ marginLeft: "auto" }}>
          <input placeholder="Pesquisar por nome, condomínio, nota..." value={query} onChange={(e) => setQuery(e.target.value)} style={styles.search} />
        </div>
      </nav>

      <main style={styles.main}>
        {tab === "crm" && <CRMPage agenda={agenda} followups={followups} clients={clients} setClients={setClients} />}
        {tab === "campaigns" && <CampaignsArea campaigns={campaigns} setCampaigns={setCampaigns} query={query} />}
        {tab === "strategy" && <StrategyArea list={strategies} setList={setStrategies} campaigns={campaigns} query={query} />}
        {tab === "agenda" && <AgendaArea items={agenda} setItems={setAgenda} clients={clients} query={query} />}
        {tab === "followup" && <FollowupArea items={followups} setItems={setFollowups} agenda={agenda} clients={clients} query={query} totals={{ totalEstimated, totalCommission, conversionRate, closedCount }} />}

        {analysisModalOpen && (
          <AnalysisModal
            onClose={() => { setAnalysisModalOpen(false); setAnalysisTextPreview(""); setSelectedFileName(""); }}
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

function AuthScreen({ onLogin, onRegister, errorMessage }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [cepOrCity, setCepOrCity] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (isRegistering) {
      if (password !== confirmPassword) {
        alert('As senhas não coincidem!');
        return;
      }
      onRegister({ username, password, fullName, cepOrCity, cpf, email });
    } else {
      onLogin(username, password);
    }
  };

  return (
    <div style={authStyles.container}>
      <div style={authStyles.card}>
        <img src={COMPANY_LOGO_URL} alt="Company Logo" style={authStyles.logoImage} />
        <p style={authStyles.slogan}>ENERGIA INTELIGENTE, PARA O NOSSO FUTURO E DO MUNDO.</p>
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
            <>
              <input
                type="password"
                placeholder="Confirme a senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={authStyles.input}
                required
              />
              <input
                type="text"
                placeholder="Nome Completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={authStyles.input}
                required
              />
              <input
                type="text"
                placeholder="CEP ou Cidade"
                value={cepOrCity}
                onChange={(e) => setCepOrCity(e.target.value)}
                style={authStyles.input}
                required
              />
              <input
                type="text"
                placeholder="CPF (apenas números ou com máscara)"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                style={authStyles.input}
                required
              />
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={authStyles.input}
                required
              />
            </>
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
          setFullName('');
          setCepOrCity('');
          setCpf('');
          setEmail('');
        }} style={authStyles.secondaryBtn}>
          {isRegistering ? 'Já tem uma conta? Faça login' : 'Não tem conta? Cadastre-se'}
        </button>
      </div>
    </div>
  );
}

function AnalysisModal({ onClose, onUploadAndAnalyze, analyses, loading, previewText, selectedFileName, onDeleteAnalysis }) {
  const [file, setFile] = useState(null);

  return (
    <div style={modalStyles.backdrop} onClick={onClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
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
                        <button style={styles.iconSmall} onClick={() => { if (window.confirm("Remover análise?")) onDeleteAnalysis(a.id); }}>🗑️</button>
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

function CRMPage({ agenda, followups, clients, setClients }) {
  const [form, setForm] = useState({ nome: "", endereco: "", telefone: "", email: "", redes: "", aniversario: "", empresa: "", cargo: "", abordagem: "" });
  const [lista, setLista] = useLocalState(LS_KEYS.clients, clients || []);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (setClients) setClients(lista);
  }, [lista, setClients]);

  const salvar = () => {
    if (!form.nome) return alert("Preencha o nome.");
    const novo = { ...form, id: uid("client"), createdAt: new Date().toISOString() };
    setLista((c) => [novo, ...c]);
    setForm({ nome: "", endereco: "", telefone: "", email: "", redes: "", aniversario: "", empresa: "", cargo: "", abordagem: "" });
  };

  const historico = (nome) => {
    const agendaCliente = agenda.filter((a) => a.name && a.name.toLowerCase().includes(nome.toLowerCase()));
    const followCliente = followups.filter((f) => f.clientName && f.clientName.toLowerCase().includes(nome.toLowerCase()));
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
        <div style={modalStyles.backdrop} onClick={()=>setSelected(null)}>
          <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
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

function CampaignsArea({ campaigns, setCampaigns, query }) {
  const [form, setForm] = useState({ 
    nome: "", 
    descricao: "", 
    dataInicio: "", 
    dataFim: "", 
    produto: "", 
    publicoAlvo: "", 
    metaConversao: "", 
    orcamento: "", 
    canais: { email:false, reuniao:false, whatsapp:false, telefonema:false, visita:false },
    status: "Planejada", 
    notas: "" 
  });
  const [editingId, setEditingId] = useState(null);

  const add = () => {
    if (!form.nome) return alert("Preencha o nome da campanha.");
    if (editingId) {
      setCampaigns((c) => c.map((item) => item.id === editingId ? { ...form, id: editingId } : item));
      setEditingId(null);
    } else {
      setCampaigns((c) => [{ ...form, id: uid("camp"), createdAt: new Date().toISOString() }, ...c]);
    }
    setForm({ nome: "", descricao: "", dataInicio: "", dataFim: "", produto: "", publicoAlvo: "", metaConversao: "", orcamento: "", canais: { email:false, reuniao:false, whatsapp:false, telefonema:false, visita:false }, status: "Planejada", notas: "" });
  };

  const edit = (camp) => {
    setForm(camp);
    setEditingId(camp.id);
  };

  const remove = (id) => {
    if (window.confirm("Remover esta campanha?")) {
      setCampaigns((c) => c.filter((i) => i.id !== id));
    }
  };

  const cancelEdit = () => {
    setForm({ nome: "", descricao: "", dataInicio: "", dataFim: "", produto: "", publicoAlvo: "", metaConversao: "", orcamento: "", canais: { email:false, reuniao:false, whatsapp:false, telefonema:false, visita:false }, status: "Planejada", notas: "" });
    setEditingId(null);
  };

  const filtered = campaigns.filter((c) => [c.nome, c.descricao, c.produto, c.publicoAlvo, c.status, c.notas].join(" ").toLowerCase().includes(query.toLowerCase()));

  const getStatusColor = (status) => {
    switch(status) {
      case "Ativa": return "#22C55E";
      case "Pausada": return "#F59E0B";
      case "Finalizada": return "#6B7280";
      case "Planejada": return "#3B82F6";
      default: return "#6B7280";
    }
  };

  return (
    <section>
      <h2 style={styles.h2}>📢 Campanhas de Marketing</h2>
      <div style={styles.card}>
        <div style={styles.grid}>
          <input placeholder="Nome da Campanha *" value={form.nome} onChange={(e)=>setForm({...form, nome:e.target.value})} style={{ gridColumn: "1 / -1" }} />
          <textarea placeholder="Descrição / Objetivo da Campanha" rows={2} value={form.descricao} onChange={(e)=>setForm({...form, descricao:e.target.value})} style={{ gridColumn: "1 / -1" }} />
          
          <input type="date" placeholder="Data de Início" value={form.dataInicio} onChange={(e)=>setForm({...form, dataInicio:e.target.value})} />
          <input type="date" placeholder="Data de Fim" value={form.dataFim} onChange={(e)=>setForm({...form, dataFim:e.target.value})} />

          <select value={form.produto} onChange={(e)=>setForm({...form, produto:e.target.value})} style={selectStyle}>
            <option value="">Produto relacionado</option>
            <option value="RECIEE">RECIEE</option>
            <option value="RECIAG">RECIAG</option>
            <option value="GD">GD</option>
            <option value="ML">ML</option>
            <option value="ELETROPOSTO">ELETROPOSTO</option>
          </select>

          <input placeholder="Público-alvo / Segmento" value={form.publicoAlvo} onChange={(e)=>setForm({...form, publicoAlvo:e.target.value})} />
          <input type="number" placeholder="Meta de Conversão (nº clientes)" value={form.metaConversao} onChange={(e)=>setForm({...form, metaConversao:e.target.value})} />
          <input type="number" placeholder="Orçamento Estimado (R$)" value={form.orcamento} onChange={(e)=>setForm({...form, orcamento:e.target.value})} />

          <select value={form.status} onChange={(e)=>setForm({...form, status:e.target.value})} style={selectStyle}>
            <option value="Planejada">📋 Planejada</option>
            <option value="Ativa">✅ Ativa</option>
            <option value="Pausada">⏸️ Pausada</option>
            <option value="Finalizada">🏁 Finalizada</option>
          </select>

          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Canais de Comunicação:</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <label style={styles.checkbox}><input type="checkbox" checked={form.canais.email} onChange={(e)=>setForm({...form, canais:{...form.canais, email:e.target.checked}})} /> 📧 E-mail</label>
              <label style={styles.checkbox}><input type="checkbox" checked={form.canais.reuniao} onChange={(e)=>setForm({...form, canais:{...form.canais, reuniao:e.target.checked}})} /> 👥 Reunião</label>
              <label style={styles.checkbox}><input type="checkbox" checked={form.canais.whatsapp} onChange={(e)=>setForm({...form, canais:{...form.canais, whatsapp:e.target.checked}})} /> 💬 WhatsApp</label>
              <label style={styles.checkbox}><input type="checkbox" checked={form.canais.telefonema} onChange={(e)=>setForm({...form, canais:{...form.canais, telefonema:e.target.checked}})} /> 📞 Telefonema</label>
              <label style={styles.checkbox}><input type="checkbox" checked={form.canais.visita} onChange={(e)=>setForm({...form, canais:{...form.canais, visita:e.target.checked}})} /> 🚗 Visita</label>
            </div>
          </div>

          <textarea placeholder="Notas / Observações adicionais" rows={2} value={form.notas} onChange={(e)=>setForm({...form, notas:e.target.value})} style={{ gridColumn: "1 / -1" }} />
        </div>

        <div style={{ display:"flex", gap:8, marginTop:10, alignItems:"center" }}>
          <button style={styles.primaryBtn} onClick={add}>{editingId ? "💾 Atualizar campanha" : "＋ Criar campanha"}</button>
          {editingId && <button style={styles.smallBtn} onClick={cancelEdit}>Cancelar edição</button>}
          <small style={{ color:"#6b7280" }}>Crie campanhas organizadas para suas estratégias de vendas.</small>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        {filtered.length === 0 ? <div style={styles.empty}>Nenhuma campanha cadastrada.</div> : (
          <div style={{ display: "grid", gap: 8 }}>
            {filtered.map((camp) => {
              const canaisAtivos = Object.keys(camp.canais || {}).filter(k => camp.canais[k]);
              return (
                <div key={camp.id} style={{ ...styles.cardSmall, borderLeft: `4px solid ${getStatusColor(camp.status)}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <strong style={{ fontSize: 16 }}>{camp.nome}</strong>
                        <span style={{ 
                          padding: "4px 10px", 
                          borderRadius: 12, 
                          fontSize: 12, 
                          fontWeight: 600, 
                          background: getStatusColor(camp.status), 
                          color: "#fff" 
                        }}>
                          {camp.status}
                        </span>
                      </div>
                      <div style={{ marginTop: 6, color: "#374151" }}>{camp.descricao}</div>
                      <div style={{ marginTop: 8, display: "flex", gap: 12, flexWrap: "wrap", fontSize: 13 }}>
                        {camp.produto && <div>🎯 <strong>Produto:</strong> {camp.produto}</div>}
                        {camp.publicoAlvo && <div>👥 <strong>Público:</strong> {camp.publicoAlvo}</div>}
                        {camp.metaConversao && <div>📊 <strong>Meta:</strong> {camp.metaConversao} clientes</div>}
                        {camp.orcamento && <div>💰 <strong>Orçamento:</strong> {formatBR(camp.orcamento)}</div>}
                      </div>
                      {(camp.dataInicio || camp.dataFim) && (
                        <div style={{ marginTop: 6, fontSize: 13, color: "#6b7280" }}>
                          📅 {camp.dataInicio ? new Date(camp.dataInicio).toLocaleDateString('pt-BR') : '—'} até {camp.dataFim ? new Date(camp.dataFim).toLocaleDateString('pt-BR') : '—'}
                        </div>
                      )}
                      {canaisAtivos.length > 0 && (
                        <div style={{ marginTop: 6, fontSize: 13 }}>
                          <strong>Canais:</strong> {canaisAtivos.map(c => {
                            const icons = { email: "📧", reuniao: "👥", whatsapp: "💬", telefonema: "📞", visita: "🚗" };
                            return icons[c] || c;
                          }).join(" ")}
                        </div>
                      )}
                      {camp.notas && <div style={{ marginTop: 8, padding: 8, background: PALETTE.grayLight, borderRadius: 8, fontSize: 13 }}>{camp.notas}</div>}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <button style={styles.iconSmall} onClick={() => edit(camp)} title="Editar">✏️</button>
                      <button style={styles.iconSmall} onClick={() => navigator.clipboard?.writeText(JSON.stringify(camp))} title="Copiar">📋</button>
                      <button style={styles.iconSmall} onClick={() => remove(camp.id)} title="Remover">🗑️</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function StrategyArea({ list, setList, campaigns, query }) {
  const [form, setForm] = useState({ weekRange: "", grupo: "", names: "", produto: "", campanhaId: "", indicacoes: "", types: { email:false, reuniao:false, whatsapp:false, telefonema:false, visita:false }, notes: "" });

  const add = () => {
    if (!form.weekRange) return alert("Preencha a semana.");
    const selectedCampaign = campaigns.find(c => c.id === form.campanhaId);
    const campanhaName = selectedCampaign ? selectedCampaign.nome : form.campanhaId;
    setList((c) => [{ ...form, campanha: campanhaName, id: uid("s"), createdAt: new Date().toISOString() }, ...c]);
    setForm({ weekRange: "", grupo: "", names: "", produto: "", campanhaId: "", indicacoes: "", types: { email:false, reuniao:false, whatsapp:false, telefonema:false, visita:false }, notes: "" });
  };

  const remove = (id) => setList((c) => c.filter((i) => i.id !== id));
  const filtered = list.filter((s) => [s.weekRange, s.grupo, s.names, s.produto, s.campanha, s.indicacoes, s.notes].join(" ").toLowerCase().includes(query.toLowerCase()));

  return (
    <section>
      <h2 style={styles.h2}>📋 Estratégia Semanal</h2>
      <div style={styles.card}>
        <div style={styles.grid}>
          <input placeholder="Semana (ex: 06/10 - 10/10)" value={form.weekRange} onChange={(e)=>setForm({...form, weekRange:e.target.value})} />
          <input placeholder="Grupo / Segmento" value={form.grupo} onChange={(e)=>setForm({...form, grupo:e.target.value})} />
          <input placeholder="Nome(s) / Empresa(s)" value={form.names} onChange={(e)=>setForm({...form, names:e.target.value})} />

          <select value={form.produto} onChange={(e)=>setForm({...form, produto:e.target.value})} style={selectStyle}>
            <option value="">Selecione o produto ideal</option>
            <option value="RECIEE">RECIEE</option>
            <option value="RECIAG">RECIAG</option>
            <option value="GD">GD</option>
            <option value="ML">ML</option>
            <option value="ELETROPOSTO">ELETROPOSTO</option>
          </select>

          <select value={form.campanhaId} onChange={(e)=>setForm({...form, campanhaId:e.target.value})} style={selectStyle}>
            <option value="">Selecione uma campanha</option>
            {campaigns.map(camp => (
              <option key={camp.id} value={camp.id}>{camp.nome} ({camp.status})</option>
            ))}
            <option value="Outra">➕ Outra campanha (não listada)</option>
          </select>

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
                <div style={{ marginTop:6, color:"#374151" }}>Produto: {s.produto || "—"} • Campanha: {s.campanha || "—"}</div>
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

function AgendaArea({ items, setItems, clients, query }) {
  const [loggedInUser] = useLocalState(LS_KEYS.loggedInUser, null);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [form, setForm] = useState({
    name:"", relatedPerson:"", relationNote:"", company:"", condominium:"", phone:"", email:"", datetime:"", contactType:"ligação", priority:"média", source:"", notes:""
  });
  const [showCalendarView, setShowCalendarView] = useState(false);

  const handleClientSelect = (clientId) => {
    setSelectedClientId(clientId);
    if (!clientId) {
      setForm({
        name:"", relatedPerson:"", relationNote:"", company:"", condominium:"", phone:"", email:"", datetime:"", contactType:"ligação", priority:"média", source:"", notes:""
      });
      return;
    }
    
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setForm({
        ...form,
        name: client.nome || "",
        company: client.empresa || "",
        phone: client.telefone || "",
        email: client.email || "",
      });
    }
  };

  const add = () => {
    if (!form.name) return alert("Preencha o nome do contato.");
    const obj = { ...form, id: uid("a"), createdAt: new Date().toISOString(), done:false };
    setItems((c) => [obj, ...c]);
    setForm({ name:"", relatedPerson:"", relationNote:"", company:"", condominium:"", phone:"", email:"", datetime:"", contactType:"ligação", priority:"média", source:"", notes:"" });
    setSelectedClientId("");
  };

  const remove = (id) => setItems((c) => c.filter((i)=>i.id !== id));
  const toggle = (id) => setItems((c) => c.map((i)=> i.id === id ? { ...i, done: !i.done } : i ));
  const filtered = items.filter((it) => [it.name, it.relatedPerson, it.company, it.condominium, it.phone, it.email, it.notes, it.source].join(" ").toLowerCase().includes(query.toLowerCase()));

  return (
    <section>
      <h2 style={styles.h2}>📅 Agenda</h2>
      <div style={styles.card}>
        <div style={{ marginBottom: 12, padding: 12, background: PALETTE.grayLight, borderRadius: 10 }}>
          <label style={{ fontWeight: 600, marginBottom: 6, display: "block" }}>🔍 Selecionar Cliente do CRM (preenchimento automático):</label>
          <select 
            value={selectedClientId} 
            onChange={(e) => handleClientSelect(e.target.value)}
            style={{ ...selectStyle, width: "100%" }}
          >
            <option value="">-- Selecione um cliente ou preencha manualmente --</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.nome} - {client.empresa || "Sem empresa"}</option>
            ))}
          </select>
        </div>

        <div style={styles.grid}>
          <input placeholder="Nome do contato (quem você aborda)" value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} />
          <input placeholder="Pessoa relacionada (ex: marido de Maria - decisor)" value={form.relatedPerson} onChange={(e)=>setForm({...form, relatedPerson:e.target.value})} />
          <input placeholder="Observação de relação (ex: mora apto 42)" value={form.relationNote} onChange={(e)=>setForm({...form, relationNote:e.target.value})} />
          <input placeholder="Empresa / Local" value={form.company} onChange={(e)=>setForm({...form, company:e.target.value})} />
          <input placeholder="Condomínio / Bairro" value={form.condominium} onChange={(e)=>setForm({...form, condominium:e.target.value})} />
          <input placeholder="Telefone (WhatsApp)" value={form.phone} onChange={(e)=>setForm({...form, phone:e.target.value})} />
          <input placeholder="Email (opcional)" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} />
          <input type="datetime-local" value={form.datetime} onChange={(e)=>setForm({...form, datetime:e.target.value})} />
          <select value={form.contactType} onChange={(e)=>setForm({...form, contactType:e.target.value})} style={selectStyle}><option value="ligação">Ligação</option><option value="whatsapp">WhatsApp</option><option value="visita">Visita</option><option value="reunião">Reunião</option><option value="email">Email</option></select>
          <select value={form.priority} onChange={(e)=>setForm({...form, priority:e.target.value})} style={selectStyle}><option value="alta">Alta</option><option value="média">Média</option><option value="baixa">Baixa</option></select>
          <input placeholder="Fonte / Indicador (ex: João - grupo X)" value={form.source} onChange={(e)=>setForm({...form, source:e.target.value})} />
          <textarea placeholder="Notas / Ações (ex: apresentar proposta)" rows={3} value={form.notes} onChange={(e)=>setForm({...form, notes:e.target.value})} />
        </div>

        <div style={{ display:"flex", gap:8, marginTop:10 }}>
          <button style={styles.primaryBtn} onClick={add}>＋ Agendar</button>
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

      {showCalendarView && (
        <CustomCalendarView
          events={items}
          onClose={() => setShowCalendarView(false)}
        />
      )}
    </section>
  );
}

function FollowupArea({ items, setItems, agenda, clients, query, totals }) {
  useEffect(() => {
    clients.forEach(client => {
      const exists = items.find(item => item.clientId === client.id);
      if (!exists) {
        const newFollowup = {
          id: uid("f"),
          clientId: client.id,
          clientName: client.nome,
          accountType: "",
          accountValue: "",
          firstContact: "",
          sentInvoice: "NÃO",
          proposalReady: "NÃO",
          clientPresentation: "NÃO",
          willClose: "NÃO",
          sentDocuments: "NÃO",
          signedContract: "NÃO",
          contractSignatureDate: "",
          doesntWantProduct: "NÃO",
          feedback: "",
          returnDays: "",
          paid: "NÃO",
          estimatedValue: "",
          commissionPercent: 10,
          createdAt: new Date().toISOString()
        };
        setItems(prev => [...prev, newFollowup]);
      }
    });
  }, [clients, items, setItems]);

  const update = (id, field, value) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const remove = (id) => {
    if (window.confirm("Remover este registro de follow-up?")) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const filtered = items.filter(item => 
    (item.clientName || "").toLowerCase().includes(query.toLowerCase()) ||
    (item.accountType || "").toLowerCase().includes(query.toLowerCase()) ||
    (item.feedback || "").toLowerCase().includes(query.toLowerCase())
  );

  const totalInd = items.length;
  const closed = items.filter(f => f.signedContract === "SIM").length;
  const conv = totalInd === 0 ? 0 : Math.round((closed / totalInd) * 1000) / 10;
  const totalEst = items.reduce((s, f) => s + Number(f.estimatedValue || 0), 0);
  const totalCom = items.reduce((s, f) => s + (Number(f.estimatedValue || 0) * Number(f.commissionPercent || 0) / 100), 0);

  return (
    <section>
      <h2 style={styles.h2}>📞 Follow-up de Clientes</h2>

      <div style={{ marginBottom: 12, display:"flex", gap:12, flexWrap:"wrap" }}>
        <div style={styles.reportCard}>
          <div style={{fontSize:12, color:"#6b7280"}}>Total Clientes</div>
          <div style={{fontWeight:700}}>{totalInd}</div>
        </div>
        <div style={styles.reportCard}>
          <div style={{fontSize:12, color:"#6b7280"}}>Contratos Fechados</div>
          <div style={{fontWeight:700}}>{closed}</div>
        </div>
        <div style={styles.reportCard}>
          <div style={{fontSize:12, color:"#6b7280"}}>Taxa de Conversão</div>
          <div style={{fontWeight:700}}>{conv}%</div>
        </div>
        <div style={styles.reportCard}>
          <div style={{fontSize:12, color:"#6b7280"}}>Valor Total Estimado</div>
          <div style={{fontWeight:700}}>{formatBR(totalEst)}</div>
        </div>
        <div style={styles.reportCard}>
          <div style={{fontSize:12, color:"#6b7280"}}>Comissão Total</div>
          <div style={{fontWeight:700}}>{formatBR(totalCom)}</div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={styles.empty}>Nenhum cliente cadastrado no CRM ainda.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={followupTableStyles.table}>
            <thead>
              <tr>
                <th style={followupTableStyles.th}>Cliente</th>
                <th style={followupTableStyles.th}>Tipo de Conta</th>
                <th style={followupTableStyles.th}>Valor da Conta</th>
                <th style={followupTableStyles.th}>1º Contato</th>
                <th style={{...followupTableStyles.th, background: PALETTE.greenLight}}>Enviou a Conta</th>
                <th style={{...followupTableStyles.th, background: PALETTE.greenLight}}>Proposta Pronta</th>
                <th style={{...followupTableStyles.th, background: PALETTE.greenLight}}>Apresentação ao Cliente</th>
                <th style={{...followupTableStyles.th, background: PALETTE.greenLight}}>Vai Fechar</th>
                <th style={{...followupTableStyles.th, background: PALETTE.greenLight}}>Enviou Documentos</th>
                <th style={{...followupTableStyles.th, background: "#FFFACD"}}>Assinou Contrato</th>
                <th style={{...followupTableStyles.th, background: "#FFFACD"}}>Data Assinatura</th>
                <th style={{...followupTableStyles.th, background: "#FFE4B5"}}>Não Quer Produto</th>
                <th style={{...followupTableStyles.th, background: "#FFE4B5"}}>Feedback</th>
                <th style={{...followupTableStyles.th, background: "#FFE4B5"}}>Qtd Dias Retorno</th>
                <th style={{...followupTableStyles.th, background: "#FFE4B5"}}>Pago</th>
                <th style={{...followupTableStyles.th, background: "#E0F2F1"}}>Valor Estimado</th>
                <th style={{...followupTableStyles.th, background: "#E0F2F1"}}>Comissão %</th>
                <th style={{...followupTableStyles.th, background: "#E0F2F1"}}>Comissão R$</th>
                <th style={followupTableStyles.th}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const commissionValue = (Number(item.estimatedValue || 0) * Number(item.commissionPercent || 0)) / 100;
                return (
                  <tr key={item.id} style={followupTableStyles.tr}>
                    <td style={followupTableStyles.td}><strong>{item.clientName}</strong></td>
                    <td style={followupTableStyles.td}>
                      <select 
                        value={item.accountType || ""} 
                        onChange={(e) => update(item.id, 'accountType', e.target.value)}
                        style={followupTableStyles.select}
                      >
                        <option value="">Selecione</option>
                        <option value="RECIEE">RECIEE</option>
                        <option value="RECIAG">RECIAG</option>
                        <option value="GD">GD</option>
                        <option value="ML">ML</option>
                        <option value="ELETROPOSTO">ELETROPOSTO</option>
                      </select>
                    </td>
                    <td style={followupTableStyles.td}>
                      <input 
                        type="text" 
                        value={item.accountValue || ""} 
                        onChange={(e) => update(item.id, 'accountValue', e.target.value)}
                        placeholder="R$ 0,00"
                        style={followupTableStyles.input}
                      />
                    </td>
                    <td style={followupTableStyles.td}>
                      <input 
                        type="date" 
                        value={item.firstContact || ""} 
                        onChange={(e) => update(item.id, 'firstContact', e.target.value)}
                        style={followupTableStyles.input}
                      />
                    </td>
                    <td style={followupTableStyles.td}>
                      <select 
                        value={item.sentInvoice || "NÃO"} 
                        onChange={(e) => update(item.id, 'sentInvoice', e.target.value)}
                        style={{...followupTableStyles.select, background: item.sentInvoice === "SIM" ? "#d4edda" : "#f8d7da"}}
                      >
                        <option value="SIM">SIM</option>
                        <option value="NÃO">NÃO</option>
                      </select>
                    </td>
                    <td style={followupTableStyles.td}>
                      <select 
                        value={item.proposalReady || "NÃO"} 
                        onChange={(e) => update(item.id, 'proposalReady', e.target.value)}
                        style={{...followupTableStyles.select, background: item.proposalReady === "SIM" ? "#d4edda" : "#f8d7da"}}
                      >
                        <option value="SIM">SIM</option>
                        <option value="NÃO">NÃO</option>
                      </select>
                    </td>
                    <td style={followupTableStyles.td}>
                      <select 
                        value={item.clientPresentation || "NÃO"} 
                        onChange={(e) => update(item.id, 'clientPresentation', e.target.value)}
                        style={{...followupTableStyles.select, background: item.clientPresentation === "SIM" ? "#d4edda" : "#f8d7da"}}
                      >
                        <option value="SIM">SIM</option>
                        <option value="NÃO">NÃO</option>
                      </select>
                    </td>
                    <td style={followupTableStyles.td}>
                      <select 
                        value={item.willClose || "NÃO"} 
                        onChange={(e) => update(item.id, 'willClose', e.target.value)}
                        style={{...followupTableStyles.select, background: item.willClose === "SIM" ? "#d4edda" : item.willClose === "MORNO" ? "#fff3cd" : "#f8d7da"}}
                      >
                        <option value="SIM">SIM</option>
                        <option value="MORNO">MORNO</option>
                        <option value="NÃO">NÃO</option>
                      </select>
                    </td>
                    <td style={followupTableStyles.td}>
                      <select 
                        value={item.sentDocuments || "NÃO"} 
                        onChange={(e) => update(item.id, 'sentDocuments', e.target.value)}
                        style={{...followupTableStyles.select, background: item.sentDocuments === "SIM" ? "#d4edda" : "#f8d7da"}}
                      >
                        <option value="SIM">SIM</option>
                        <option value="NÃO">NÃO</option>
                      </select>
                    </td>
                    <td style={followupTableStyles.td}>
                      <select 
                        value={item.signedContract || "NÃO"} 
                        onChange={(e) => update(item.id, 'signedContract', e.target.value)}
                        style={{...followupTableStyles.select, background: item.signedContract === "SIM" ? "#d4edda" : "#f8d7da"}}
                      >
                        <option value="SIM">SIM</option>
                        <option value="NÃO">NÃO</option>
                      </select>
                    </td>
                    <td style={followupTableStyles.td}>
                      <input 
                        type="date" 
                        value={item.contractSignatureDate || ""} 
                        onChange={(e) => update(item.id, 'contractSignatureDate', e.target.value)}
                        style={followupTableStyles.input}
                      />
                    </td>
                    <td style={followupTableStyles.td}>
                      <select 
                        value={item.doesntWantProduct || "NÃO"} 
                        onChange={(e) => update(item.id, 'doesntWantProduct', e.target.value)}
                        style={followupTableStyles.select}
                      >
                        <option value="SIM">SIM</option>
                        <option value="NÃO">NÃO</option>
                      </select>
                    </td>
                    <td style={followupTableStyles.td}>
                      <input 
                        type="text" 
                        value={item.feedback || ""} 
                        onChange={(e) => update(item.id, 'feedback', e.target.value)}
                        placeholder="Feedback..."
                        style={{...followupTableStyles.input, minWidth: "150px"}}
                      />
                    </td>
                    <td style={followupTableStyles.td}>
                      <input 
                        type="number" 
                        value={item.returnDays || ""} 
                        onChange={(e) => update(item.id, 'returnDays', e.target.value)}
                        placeholder="Dias"
                        style={{...followupTableStyles.input, width: "70px"}}
                      />
                    </td>
                    <td style={followupTableStyles.td}>
                      <select 
                        value={item.paid || "NÃO"} 
                        onChange={(e) => update(item.id, 'paid', e.target.value)}
                        style={{...followupTableStyles.select, background: item.paid === "SIM" ? "#d4edda" : "#f8d7da"}}
                      >
                        <option value="SIM">SIM</option>
                        <option value="NÃO">NÃO</option>
                      </select>
                    </td>
                    <td style={followupTableStyles.td}>
                      <input 
                        type="number" 
                        value={item.estimatedValue || ""} 
                        onChange={(e) => update(item.id, 'estimatedValue', e.target.value)}
                        placeholder="R$"
                        style={followupTableStyles.input}
                      />
                    </td>
                    <td style={followupTableStyles.td}>
                      <input 
                        type="number" 
                        value={item.commissionPercent || 10} 
                        onChange={(e) => update(item.id, 'commissionPercent', e.target.value)}
                        placeholder="%"
                        style={{...followupTableStyles.input, width: "70px"}}
                      />
                    </td>
                    <td style={followupTableStyles.td}>
                      <strong>{formatBR(commissionValue)}</strong>
                    </td>
                    <td style={followupTableStyles.td}>
                      <button 
                        onClick={() => remove(item.id)} 
                        style={styles.iconSmall}
                        title="Remover"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function CustomCalendarView({ events, onClose }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState([]);

  useEffect(() => {
    updateSelectedDayEvents(selectedDate);
  }, [selectedDate, events]);

  const updateSelectedDayEvents = (date) => {
    const dayEvents = events.filter(event => {
      if (!event.datetime) return false;
      const eventDate = new Date(event.datetime);
      return eventDate.toDateString() === date.toDateString();
    }).sort((a, b) => {
      if (a.datetime && b.datetime) {
        return new Date(a.datetime).getTime() - new Date(b.datetime).getTime();
      }
      return 0;
    });
    setSelectedDayEvents(dayEvents);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const hasEventsOnDate = (date) => {
    return events.some(event => {
      if (!event.datetime) return false;
      const eventDate = new Date(event.datetime);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const changeMonth = (delta) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  const handleDateClick = (day) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const calendarDays = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div style={modalStyles.backdrop} onClick={onClose}>
      <div style={{...modalStyles.modal, maxWidth: 1000}} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0 }}>🗓️ Calendário de Eventos</h3>
          <button style={styles.smallBtn} onClick={onClose}>Fechar</button>
        </div>
        
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 320 }}>
            <div style={calendarStyles.container}>
              <div style={calendarStyles.header}>
                <button onClick={() => changeMonth(-1)} style={calendarStyles.navButton}>‹</button>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{monthNames[month]} {year}</h4>
                <button onClick={() => changeMonth(1)} style={calendarStyles.navButton}>›</button>
              </div>

              <div style={calendarStyles.weekDays}>
                {weekDays.map(day => (
                  <div key={day} style={calendarStyles.weekDay}>{day}</div>
                ))}
              </div>

              <div style={calendarStyles.daysGrid}>
                {calendarDays.map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} style={calendarStyles.emptyDay}></div>;
                  }
                  
                  const cellDate = new Date(year, month, day);
                  const isToday = cellDate.toDateString() === new Date().toDateString();
                  const isSelected = cellDate.toDateString() === selectedDate.toDateString();
                  const hasEvents = hasEventsOnDate(cellDate);

                  return (
                    <div
                      key={day}
                      onClick={() => handleDateClick(day)}
                      style={{
                        ...calendarStyles.day,
                        ...(isToday && calendarStyles.today),
                        ...(isSelected && calendarStyles.selected),
                      }}
                    >
                      <span style={{ position: 'relative', zIndex: 1 }}>{day}</span>
                      {hasEvents && (
                        <div style={calendarStyles.eventDot}></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 320, maxHeight: 500, overflowY: "auto", padding: "0 10px" }}>
            <h4 style={{ marginTop: 0, marginBottom: 12 }}>Eventos para {selectedDate.toLocaleDateString('pt-BR')}</h4>
            {selectedDayEvents.length === 0 ? (
              <div style={styles.empty}>Nenhum evento agendado para este dia.</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {selectedDayEvents.map((event) => (
                  <div key={event.id} style={styles.cardSmall}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <strong style={{ fontSize: 15 }}>{event.name}</strong>
                      <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>
                        {event.datetime ? new Date(event.datetime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : "—"}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "#374151", marginBottom: 4 }}>
                      📍 {event.company || event.condominium || "—"}
                    </div>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>
                      {event.contactType && <span>📞 {event.contactType} • </span>}
                      {event.phone && <span>{event.phone}</span>}
                    </div>
                    {event.notes && (
                      <div style={{ marginTop: 6, fontSize: 13, padding: 8, background: PALETTE.grayLight, borderRadius: 6 }}>
                        {event.notes}
                      </div>
                    )}
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

const selectStyle = {
  padding: "10px",
  borderRadius: "10px",
  border: "1px solid #E6E9EE",
  background: "#fff",
  fontSize: "14px",
  color: "#0F1724",
  fontFamily: "Aptos, Inter, system-ui",
  cursor: "pointer",
};

const styles = {
  app: { 
    minHeight: "100vh", 
    background: PALETTE.grayLight, 
    color: PALETTE.text, 
    fontFamily: "Aptos, Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial", 
    display: "flex", 
    flexDirection: "column",
    margin: 0,
    padding: 0
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    background: PALETTE.white,
    borderBottom: `1px solid ${PALETTE.grayMedium}`,
    position: "sticky",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20
  },
  logo: { fontWeight: 800, color: PALETTE.greenDark, fontSize: 18 },
  subtitle: { fontSize: 13, color: "#6b7280" },
  metric: { padding: "6px 10px", borderRadius: 10, background: "#fff", border: `1px solid ${PALETTE.grayMedium}`, textAlign: "center" },
  iconButton: { background: PALETTE.white, border: `1px solid ${PALETTE.grayMedium}`, padding: 8, borderRadius: 10, cursor: "pointer", display: "inline-flex", alignItems: "center" },
  nav: { 
    display: "flex", 
    gap: 8, 
    alignItems: "center", 
    padding: "12px 16px", 
    borderBottom: `1px solid ${PALETTE.grayMedium}`, 
    flexWrap: "wrap",
    background: PALETTE.white
  },
  tab: { display: "flex", gap: 8, alignItems: "center", padding: "8px 12px", borderRadius: 10, border: `1px solid ${PALETTE.grayMedium}`, background: "transparent", color: PALETTE.text, cursor: "pointer" },
  tabActive: { display: "flex", gap: 8, alignItems: "center", padding: "8px 12px", borderRadius: 10, border: `1px solid ${PALETTE.greenDark}`, background: PALETTE.greenDark, color: PALETTE.white, cursor: "pointer" },
  search: { padding: "8px 12px", borderRadius: 10, border: `1px solid ${PALETTE.grayMedium}`, minWidth: 220 },
  main: { 
    padding: 16, 
    flex: 1, 
    maxWidth: 1100, 
    margin: "0 auto", 
    width: "100%"
  },
  h2: { marginBottom: 8, color: PALETTE.blueDark },
  card: { background: PALETTE.white, borderRadius: 16, padding: 14, boxShadow: "0 6px 18px rgba(7,11,19,0.06)" },
  cardSmall: { background: PALETTE.white, borderRadius: 12, padding: 12, border: `1px solid ${PALETTE.grayMedium}` },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 },
  primaryBtn: { background: PALETTE.greenDark, color: PALETTE.white, padding: "10px 14px", borderRadius: 12, border: "none", cursor: "pointer", boxShadow: "0 6px 14px rgba(10,104,71,0.12)" },
  smallBtn: { padding: "8px 10px", borderRadius: 10, border: `1px solid ${PALETTE.grayMedium}`, background: PALETTE.white, cursor: "pointer" },
  iconSmall: { padding: 8, borderRadius: 8, border: `1px solid ${PALETTE.grayMedium}`, background: "transparent", cursor: "pointer" },
  empty: { padding: 12, color: "#6b7280", fontStyle: "italic" },
  footer: { 
    padding: 12, 
    textAlign: "center", 
    color: "#6b7280",
    background: PALETTE.white,
    borderTop: `1px solid ${PALETTE.grayMedium}`
  },
  reportCard: { background: "#fff", borderRadius: 10, padding: 10, border: `1px solid ${PALETTE.grayMedium}`, minWidth: 140, textAlign: "center" },
  checkbox: { display: "flex", alignItems: "center", gap: 6 }
};

const authStyles = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    padding: "20px 40px",
    backgroundImage: `url(${BACKGROUND_IMAGE_URL})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    margin: 0,
    overflow: 'auto'
  },
  card: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 30,
    boxShadow: "0 15px 40px rgba(7,11,19,0.2)",
    width: "100%",
    maxWidth: 450,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 15,
  },
  logoImage: {
    maxWidth: '180px',
    height: 'auto',
    marginBottom: 10,
  },
  slogan: {
    fontSize: 16,
    fontWeight: 500,
    color: PALETTE.blueDark,
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: '85%',
    lineHeight: 1.4,
  },
  title: {
    margin: "0 0 15px 0",
    color: PALETTE.greenDark,
    textAlign: "center",
    fontSize: 28,
    fontWeight: 700,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 15,
    width: '100%',
  },
  input: {
    padding: "14px 18px",
    borderRadius: 12,
    border: `1px solid ${PALETTE.grayMedium}`,
    fontSize: 16,
    width: "100%",
  },
  primaryBtn: {
    background: PALETTE.greenDark,
    color: PALETTE.white,
    padding: "14px 20px",
    borderRadius: 14,
    border: "none",
    cursor: "pointer",
    fontSize: 18,
    fontWeight: "bold",
    boxShadow: "0 6px 14px rgba(10,104,71,0.12)",
    marginTop: 10,
    width: '100%',
  },
  secondaryBtn: {
    padding: "12px 18px",
    borderRadius: 12,
    border: `1px solid ${PALETTE.blueDark}`,
    background: "transparent",
    color: PALETTE.blueDark,
    cursor: "pointer",
    fontSize: 15,
    marginTop: 10,
    width: '100%',
  },
  error: {
    color: PALETTE.redError,
    textAlign: "center",
    fontSize: 14,
    marginBottom: 10,
    fontWeight: 'bold',
  }
};

const followupTableStyles = {
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: PALETTE.white,
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(7,11,19,0.08)"
  },
  th: {
    padding: "12px 8px",
    textAlign: "left",
    fontSize: 13,
    fontWeight: 700,
    color: PALETTE.text,
    borderBottom: `2px solid ${PALETTE.grayMedium}`,
    background: PALETTE.grayLight,
    whiteSpace: "nowrap"
  },
  tr: {
    borderBottom: `1px solid ${PALETTE.grayMedium}`,
  },
  td: {
    padding: "10px 8px",
    fontSize: 13,
    color: PALETTE.text,
    verticalAlign: "middle"
  },
  input: {
    width: "100%",
    padding: "6px 8px",
    fontSize: 13,
    border: `1px solid ${PALETTE.grayMedium}`,
    borderRadius: 6,
    background: PALETTE.white
  },
  select: {
    width: "100%",
    padding: "6px 8px",
    fontSize: 13,
    border: `1px solid ${PALETTE.grayMedium}`,
    borderRadius: 6,
    cursor: "pointer"
  }
};

const calendarStyles = {
  container: {
    background: PALETTE.white,
    borderRadius: 12,
    padding: 16,
    border: `1px solid ${PALETTE.grayMedium}`,
    boxShadow: "0 4px 12px rgba(7,11,19,0.06)"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    padding: "8px 0"
  },
  navButton: {
    background: "transparent",
    border: `1px solid ${PALETTE.grayMedium}`,
    borderRadius: 8,
    padding: "6px 12px",
    cursor: "pointer",
    fontSize: 18,
    fontWeight: "bold",
    color: PALETTE.blueDark
  },
  weekDays: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 4,
    marginBottom: 8
  },
  weekDay: {
    textAlign: "center",
    fontWeight: 700,
    fontSize: 13,
    color: PALETTE.text,
    padding: 8
  },
  daysGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 4
  },
  emptyDay: {
    height: 50
  },
  day: {
    height: 50,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    position: "relative",
    background: PALETTE.white,
    border: `1px solid transparent`,
    transition: "background-color 0.2s ease, border-color 0.2s ease"
  },
  today: {
    background: PALETTE.grayLight,
    fontWeight: 700
  },
  selected: {
    background: PALETTE.greenDark,
    color: PALETTE.white,
    fontWeight: 700,
    border: `1px solid ${PALETTE.greenDark}`
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: PALETTE.greenDark,
    position: "absolute",
    bottom: 6
  }
};

const modalStyles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 60,
    overflowY: "auto",
  },
  modal: {
    width: "92%",
    maxWidth: 980,
    minHeight: "400px",
    background: "#fff",
    borderRadius: 12,
    padding: 18,
    boxShadow: "0 12px 40px rgba(7,11,19,0.25)",
    maxHeight: "90vh",
    overflowY: "auto",
  }
};

function globalCss() {
  return `
    * { 
      box-sizing: border-box; 
      margin: 0;
      padding: 0;
    }
    html, body, #root { 
      height: 100%; 
      margin: 0;
      padding: 0;
      width: 100%;
      overflow-x: hidden;
    }
    input, select, textarea, button { 
      font-family: inherit; 
      font-size: 14px; 
      color: ${PALETTE.text}; 
    }
    input, select, textarea { 
      padding: 10px; 
      borderRadius: 10px; 
      border: 1px solid ${PALETTE.grayMedium}; 
      background: #fff; 
    }
    textarea { 
      resize: vertical; 
    }
    button { 
      transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease; 
    }
    button:hover { 
      opacity: 0.9; 
    }
    
    @media (max-width: 768px) {
      .grid { grid-template-columns: 1fr !important; }
      input[placeholder], textarea[placeholder] { font-size: 14px; }
    }
  `;
}
