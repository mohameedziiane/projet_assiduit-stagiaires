const SESSION_KEY = "session";
const TOKEN_KEY = "token";
const ROLE_KEY = "role";
const SESSION_EVENT = "session-updated";

function emitSessionUpdate() {
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);

    if (!raw) {
      return null;
    }

    const session = JSON.parse(raw);

    if (!session || typeof session !== "object") {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export function getSessionUser() {
  const session = getSession();

  if (!session) {
    return null;
  }

  return session.user || session;
}

export function getSessionRole() {
  const session = getSession();

  if (!session) {
    return null;
  }

  if (typeof session.role === "string") {
    return session.role;
  }

  if (session.role && typeof session.role === "object") {
    return session.role.nom || null;
  }

  if (typeof session.user?.role === "string") {
    return session.user.role;
  }

  if (session.user?.role && typeof session.user.role === "object") {
    return session.user.role.nom || null;
  }

  return null;
}

export function setSession({ token, user }) {
  const role = user?.role?.nom || user?.role || null;

  const session = {
    ...user,
    token,
    role,
    user,
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));

  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }

  if (role) {
    localStorage.setItem(ROLE_KEY, role);
  } else {
    localStorage.removeItem(ROLE_KEY);
  }

  emitSessionUpdate();

  return session;
}

export function updateSessionUser(user) {
  const session = getSession();

  if (!session) {
    return null;
  }

  const token = session.token || localStorage.getItem(TOKEN_KEY) || null;

  return setSession({
    token,
    user,
  });
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  emitSessionUpdate();
}

export function getAuthToken() {
  const session = getSession();

  if (session?.token) {
    return session.token;
  }

  return localStorage.getItem(TOKEN_KEY);
}

export function getDefaultRouteByRole(role) {
  switch (role) {
    case "stagiaire":
      return "/stagiaire/dashboard";
    case "formateur":
      return "/formateur/dashboard";
    case "gestionnaire":
      return "/gestionnaire/dashboard";
    case "directeur":
      return "/directeur/dashboard";
    case "admin":
      return "/admin/password-reset-requests";
    default:
      return "/";
  }
}

export function getPasswordChangeRouteByRole(role) {
  switch (role) {
    case "stagiaire":
      return "/stagiaire/profil";
    case "formateur":
      return "/formateur/mot-de-passe";
    case "gestionnaire":
      return "/gestionnaire/mot-de-passe";
    case "directeur":
      return "/directeur/mot-de-passe";
    case "admin":
      return "/admin/mot-de-passe";
    default:
      return "/";
  }
}

export function subscribeToSessionUpdates(listener) {
  window.addEventListener(SESSION_EVENT, listener);

  return () => {
    window.removeEventListener(SESSION_EVENT, listener);
  };
}
