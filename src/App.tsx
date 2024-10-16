import { useCallback, useEffect, useReducer, useState } from "react";
import "./App.css";

const getRandomId = () => Math.round(Math.random() * 10000000);

interface Task {
  description: string;
  date: Date | string;
  id?: number;
}

interface AppState {
  tasks: Task[];
}

type Action =
  | { type: "add" | "delete"; payload: Task }
  | { type: "reload"; state: AppState };

const initState: AppState = {
  tasks: [
    // {
    //   description: "Go for walk",
    //   date: new Date(),
    //   id: getRandomId(),
    // },
  ],
};

const errorsInit = {
  description: null,
};

const persistState = (state: AppState) =>
  localStorage.setItem("tasks", JSON.stringify(state));

const getPersistedState = (): AppState | undefined =>
  JSON.parse(localStorage.getItem("tasks") ?? "undefined");

const reducer: React.Reducer<AppState, Action> = (state, action) => {
  switch (action.type) {
    case "add":
      if (action.payload?.id) return state;
      const id = getRandomId();
      action.payload.id = id;
      state.tasks = [...state.tasks, action.payload];
      break;
    case "delete":
      const task = action.payload;
      const taskId = task.id;
      state.tasks = state.tasks.filter((task) => task.id !== taskId);
      break;
    case "reload":
      return action.state;
    default:
      return state;
  }

  const newState = { ...state };
  persistState(newState);
  return newState;
};

function App() {
  const [state, dispatch] = useReducer(reducer, initState);
  const [errors, setErrors] = useState<{ description: null | string }>(
    errorsInit
  );

  useEffect(() => {
    const restoreState = () => {
      const persistedState = getPersistedState();
      if (
        persistedState &&
        state.tasks.length !== persistedState.tasks.length
      ) {
        dispatch({ type: "reload", state: persistedState });
      }
    };
    window.addEventListener("storage", restoreState);

    return () => window.removeEventListener("storage", restoreState);
  }, []);

  const handleSubmit = useCallback((ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const formElem = ev.currentTarget;
    const formData = new FormData(formElem);
    const data = Object.fromEntries(formData.entries());
    const description = data.description as string;
    const payload = {
      description: description.length ? description[0].toUpperCase() + description.slice(1) : description,
      date: new Date(),
    };

    if (payload.description) {
      dispatch({ type: "add", payload });
      formElem.reset();
    } else {
      setErrors((errors) => {
        errors.description = "Need a description";
        return { ...errors };
      });
    }
  }, []);

  const handleDelete = useCallback(
    (ev: React.PointerEvent<HTMLButtonElement>) => {
      const buttonElem = ev.currentTarget;
      const task = JSON.parse(buttonElem.dataset["task"] ?? "undefined");
      if (task) {
        dispatch({ type: "delete", payload: task });
      }
    },
    []
  );

  return (
    <>
      <h1>To Do</h1>
      <section>
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="fieldset">
              <input
                key="description"
                id="description"
                name="description"
                placeholder="Description"
                autoComplete="off"
                onChange={() => setErrors({ description: null })}
                className="grow"
              />
              <button disabled={!!errors.description?.length}>Add</button>
            </div>
            {errors?.description && (
              <span className="error"
              >
                {errors.description}
              </span>
            )}
          </form>
        </div>
        <div className="card">
          <ul>
            {state.tasks.map((task) => {
              return (
                <li key={task.id}>
                  {task.description}{" "}
                  <button
                    data-task={JSON.stringify(task)}
                    onClick={handleDelete}
                  >
                    delete
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </>
  );
}

export default App;
