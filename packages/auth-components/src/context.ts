import h from "@macrostrat/hyper";
import {
  useAPIActions,
  APIContext,
  APIActions,
} from "@macrostrat/ui-components";
import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  Dispatch,
  useCallback,
} from "react";

type AnyUser = string | object;

type RequestForm = { type: "request-form"; enabled?: boolean };
type Credentials<T = AnyUser> = { user: T; password: string };
type LoginStatus<T = AnyUser> = {
  user: T;
  error: Error | null;
};
type UpdateUser<T> = { type: "update-user"; user: T };

type UpdateStatus<T> = {
  type: "update-status";
  payload: Partial<LoginStatus<T>>;
};
type AuthSuccess<T> = {
  type: "auth-form-success";
  payload: LoginStatus<T>;
};

type AuthFailure<T> = { type: "auth-form-failure"; payload: LoginStatus<T> };

export type AuthAction<T = AnyUser> =
  | Logout
  | RequestForm
  | UpdateStatus<T>
  | AuthSuccess<T>
  | AuthFailure<T>
  | UpdateUser<T>;

type GetStatus = { type: "get-status" };
type Login = { type: "login" };
type Logout = { type: "logout" };

export type AsyncAuthAction = GetStatus | Login | Logout;

type AuthDispatch<T> = Dispatch<AuthAction<T>>;
type AuthTransformer<T> = (
  action: AuthAction<T> | AsyncAuthAction
) => Promise<AuthAction<T> | null>;

function useAuthActions<T>(
  dispatch: AuthDispatch<T>,
  transformer: AuthTransformer<T>
) {
  return useCallback(
    async (action: AuthAction<T> | AsyncAuthAction) => {
      const newAction = await transformer(action);
      if (newAction == null) return;
      dispatch(newAction);
    },
    [dispatch, transformer]
  );
}

function useDefaultTransformer<T>(
  dispatch: AuthDispatch<T>,
  apiContext: APIContext
): AuthTransformer<T> {
  const apiActions = useAPIActions(apiContext);
  return async (action: AuthAction | AsyncAuthAction) => {
    return await defaultTransformer(action, apiActions);
  };
}

async function defaultTransformer(
  action: AuthAction | AsyncAuthAction,
  apiActions: APIActions
) {
  /** This transformer is taken directly from Sparrow */
  const { get, post } = apiActions;
  switch (action.type) {
    case "get-status":
      // Right now, we get login status from the
      // /auth/refresh endpoint, which refreshes access
      // tokens allowing us to extend our session.
      // It could be desirable for security (especially
      // when editing information becomes a factor) to
      // only refresh tokens when access is proactively
      // granted by the application.
      try {
        const { login, user } = await get("/auth/status");
        return {
          type: "update-status",
          payload: { login, user, error: null },
        };
      } catch (error) {
        return { type: "update-status", payload: { error } };
      }
    case "login":
      try {
        const res = await post("/auth/login", action.payload);
        const { login, user } = res;
        return {
          type: "auth-form-success",
          payload: { user, login, error: null },
        };
      } catch (error) {
        return {
          type: "auth-form-failure",
          payload: { login: false, user: null, error },
        };
      }
    case "logout": {
      const { login } = await post("/auth/logout", {});
      return {
        type: "auth-form-success",
        payload: {
          login,
          user: null,
          error: null,
        },
      };
    }
    default:
      return action;
  }
}

interface AuthState<T extends AnyUser> {
  user: T | null;
  isLoggingIn: boolean;
  invalidAttempt: boolean;
  error: Error | null;
}

interface AuthCtx<T extends AnyUser> extends AuthState<T> {
  runAction(action: AuthAction | AsyncAuthAction): Promise<void>;
  userIdentity(user: T): React.ReactNode;
}

const authDefaultState: AuthState<string> = {
  user: null,
  isLoggingIn: false,
  invalidAttempt: false,
  error: null,
};

function defaultUserIdentity(user: AnyUser) {
  return user != null ? "Logged in" : null;
}

const AuthContext = createContext<AuthCtx<any>>({
  ...authDefaultState,
  async runAction() {},
  userIdentity: defaultUserIdentity,
});

function authReducer(state = authDefaultState, action: AuthAction) {
  switch (action.type) {
    case "update-user":
      return { ...state, user: action.user };
    case "logout":
      return {
        ...state,
        user: null,
        isLoggingIn: false,
        invalidAttempt: false,
      };
    case "update-status": {
      return {
        ...state,
        ...action.payload
      };
    }
    case "auth-form-success": {
      return {
        ...action.payload,
        isLoggingIn: false,
        invalidAttempt: false,
      };
    }
    case "auth-form-failure":
      return {
        ...state,
        ...action.payload,
        isLoggingIn: true,
        invalidAttempt: true,
      };
    case "request-form":
      return {
        ...state,
        isLoggingIn: action.enabled ?? true,
        invalidAttempt: false,
      };
    default:
      return state;
  }
}

interface AuthProviderProps<T = AnyUser> {
  context: APIContext;
  user: T;
  children: React.ReactNode;
}

function AuthProvider<T extends AnyUser>(props: AuthProviderProps<T>) {
  const { context, children, user } = props;
  const [state, dispatch] = useReducer(authReducer, authDefaultState);
  const transformer = useDefaultTransformer(dispatch, context);

  return h(
    BaseAuthProvider,
    {
      user,
      children,
      transformer,
      userIdentity: defaultUserIdentity,
    },
    children
  );
}

interface BaseAuthProviderProps<T = AnyUser> {
  user: T;
  children: React.ReactNode;
  transformer: AuthTransformer<T>;
  userIdentity(user: T): React.ReactNode;
}

function BaseAuthProvider<T extends AnyUser>(props: BaseAuthProviderProps<T>) {
  /** Base authentication provider for customization. Allows a custom implementation of API actions */
  const {
    children,
    user,
    transformer,
    userIdentity = defaultUserIdentity,
  } = props;
  const [state, dispatch] = useReducer(authReducer, {
    ...authDefaultState,
    user,
  });
  const runAction = useAuthActions(dispatch, transformer);
  useEffect(() => {
    if (user != null) return;
    runAction({ type: "get-status" });
  }, [user, runAction]);
  return h(
    AuthContext.Provider,
    { value: { user, runAction, userIdentity, ...state } },
    children
  );
}

const useAuth = () => useContext(AuthContext);

export {
  AuthContext,
  AuthProvider,
  useAuth,
  BaseAuthProvider,
  defaultUserIdentity,
  useDefaultTransformer,
};
