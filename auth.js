/* ============================================================
   Dor L'Dor sign-in — shared by index.html and signin.html.
   EDIT HERE once the Supabase project is ready:
     url     = Project URL        (Supabase > Project Settings > API)
     anonKey = anon / public key  (same screen)
   While these are "", sign-in is switched off and the forms on
   the main page work without an account.
   ============================================================ */
const DORLDOR_SUPABASE = { url: "", anonKey: "" };

const Auth = (() => {
  const configured = !!(DORLDOR_SUPABASE.url && DORLDOR_SUPABASE.anonKey);
  let ready = null;

  function client() {
    if (!configured) return Promise.resolve(null);
    if (!ready) ready = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      s.onload = () => resolve(window.supabase.createClient(DORLDOR_SUPABASE.url, DORLDOR_SUPABASE.anonKey));
      s.onerror = () => reject(new Error("Could not load sign-in"));
      document.head.append(s);
    });
    return ready;
  }

  async function user() {
    const c = await client();
    if (!c) return null;
    const { data } = await c.auth.getSession();
    return data && data.session ? data.session.user : null;
  }

  async function signInWithGoogle(returnTo) {
    const c = await client();
    if (!c) throw new Error("Sign-in is not connected yet");
    const { error } = await c.auth.signInWithOAuth({ provider: "google", options: { redirectTo: returnTo } });
    if (error) throw error;
  }

  async function signOut() {
    const c = await client();
    if (c) await c.auth.signOut();
  }

  // Email + password
  async function signUpWithEmail(name, email, password, returnTo) {
    const c = await client();
    if (!c) throw new Error("Sign-in is not connected yet");
    const { data, error } = await c.auth.signUp({ email, password,
      options: { data: { full_name: name }, emailRedirectTo: returnTo } });
    if (error) throw error;
    return !!(data && data.session);           // false = must confirm email first
  }

  async function signInWithEmail(email, password) {
    const c = await client();
    if (!c) throw new Error("Sign-in is not connected yet");
    const { error } = await c.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function sendPasswordReset(email, returnTo) {
    const c = await client();
    if (!c) throw new Error("Sign-in is not connected yet");
    const { error } = await c.auth.resetPasswordForEmail(email, { redirectTo: returnTo });
    if (error) throw error;
  }

  async function setNewPassword(password) {
    const c = await client();
    const { error } = await c.auth.updateUser({ password });
    if (error) throw error;
  }

  async function onRecovery(fn) {
    const c = await client();
    if (c) c.auth.onAuthStateChange(e => { if (e === "PASSWORD_RECOVERY") fn(); });
  }

  // Profile details live on the account itself (name + phone).
  async function updateProfile(name, phone) {
    const c = await client();
    if (!c) throw new Error("Sign-in is not connected yet");
    const { data, error } = await c.auth.updateUser({ data: { full_name: name, phone } });
    if (error) throw error;
    return data && data.user;
  }

  function phoneOf(u) { return ((u && u.user_metadata) || {}).phone || ""; }

  function displayName(u) {
    const m = (u && u.user_metadata) || {};
    return m.full_name || m.name || (u && u.email) || "";
  }

  return { configured, client, user, signInWithGoogle, signOut, displayName,
           signUpWithEmail, signInWithEmail, sendPasswordReset, setNewPassword, onRecovery,
           updateProfile, phoneOf };
})();
