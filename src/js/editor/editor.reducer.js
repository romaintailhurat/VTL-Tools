import KEY from "./key-bind";
import * as actions from "./editor.actions";

let getTokens_ = undefined;
/* */
const initialState = {
  lines: [{ value: "", tokens: [] }],
  index: 0,
  focusedRow: undefined,
  focusedToken: undefined,
  prefix: undefined,
  cursorRect: undefined
};

/* */
export const initializer = getTokens => {
  getTokens_ = getTokens;
  return initialState;
};

/* */
const reducer = (state, action) => {
  const newState = (() => {
    switch (action.type) {
      case actions.SET_CURSOR_RECT:
        return { ...state, cursorRect: action.payload.rect };

      case actions.RESET_PREFIX:
        return { ...state, prefix: undefined };
      case actions.CHECK_PREFIX:
        return { ...state };

      case actions.SET_CURSOR_POSITION:
        return {
          ...state,
          index: action.payload.index,
          focusedRow: action.payload.numberRow
        };
      case "change-editor-content":
        return { ...state, lines: action.lines.map(row => getNewRow(row)) };
      case KEY.ARROW_LEFT:
        return reduceKeyLeft(state);
      case KEY.ARROW_RIGHT:
        return reduceKeyRight(state);
      case KEY.ARROW_UP:
        return { ...state, focusedRow: Math.max(0, state.focusedRow - 1) };
      case KEY.ARROW_DOWN:
        return {
          ...state,
          focusedRow: Math.min(state.lines.length - 1, state.focusedRow + 1)
        };
      case KEY.BACK_SPACE:
        return reduceKeyBackspace(state);
      case KEY.DELETE:
        return reduceKeyDelete(state);
      case KEY.ENTER:
        return reduceKeyEnter(state);
      case KEY.HOME:
        return { ...state, index: 0 };
      case KEY.END:
        return { ...state, index: getRowLength(state) };
      case actions.CHECK_INDEX:
        return { ...state, index: Math.min(state.index, getRowLength(state)) };
      case "pressed-char":
        return {
          ...appendCharAtCursor(state)(action.key)
        };
      default:
        console.warn(`Unbind event ${action.type}`);
        return state;
    }
  })();
  console.debug("%cDebug", "color: purple;", { action, state, newState });
  return newState;
};

/* ARROW_LEFT */
const reduceKeyLeft = state => {
  const focusedRow =
    state.index - 1 < 0 ? Math.max(0, state.focusedRow - 1) : state.focusedRow;
  const index =
    state.index - 1 < 0
      ? state.focusedRow === 0
        ? state.focusedRow
        : getRowLength({ ...state, focusedRow })
      : state.index - 1;

  return { ...state, index, focusedRow };
};

/* ARROW_RIGHT */
const reduceKeyRight = state => {
  const currentLength = getRowLength(state);
  const focusedRow =
    state.index + 1 > currentLength
      ? Math.min(state.lines.length - 1, state.focusedRow + 1)
      : state.focusedRow;
  const index =
    state.index + 1 > currentLength
      ? state.focusedRow === state.lines.length - 1
        ? getRowLength({ ...state, focusedRow })
        : 0
      : state.index + 1;

  return { ...state, index, focusedRow };
};
/* DELETE */
const reduceKeyDelete = ({ lines, index, focusedRow, ...rest }) => {
  const rowSize = getRowLength({ lines, focusedRow });
  const isMerging =
    (rowSize - 1 < 0 || index === rowSize) && focusedRow !== lines.length - 1;
  const nextLines = lines.reduce(
    (a, line, i) =>
      i === focusedRow
        ? isMerging
          ? mergeRow({
              lines: [...a, line, { ...lines[focusedRow + 1] }],
              focusedRow: focusedRow + 1
            })
          : [
              ...a,
              getNewRow(
                `${line.value.substr(0, index)}${line.value.substr(index + 1)}`
              )
            ]
        : i === focusedRow + 1 && isMerging
        ? a
        : [...a, line],
    []
  );

  return { lines: nextLines, index, focusedRow, ...rest };
};

/* BACK_SPACE */
const reduceKeyBackspace = ({ lines, index, focusedRow, ...rest }) => {
  const newFocusedRow =
    index === 0 ? (focusedRow === 0 ? 0 : focusedRow - 1) : focusedRow;
  const newIndex =
    index === 0
      ? focusedRow === 0
        ? 0
        : getRowLength({ lines, focusedRow: newFocusedRow })
      : index - 1;
  const newLines =
    index === 0
      ? focusedRow === 0
        ? lines
        : mergeRow({ lines, index, focusedRow })
      : removeCharFromRow({ lines, index, focusedRow });

  return {
    ...rest,
    lines: newLines,
    focusedRow: newFocusedRow,
    index: newIndex
  };
};

const mergeRow = ({ lines, focusedRow }) =>
  lines.reduce(
    (a, line, i) =>
      i === focusedRow - 1
        ? [...a, getNewRow(line.value.concat(lines[focusedRow].value))]
        : i === focusedRow
        ? a
        : [...a, line],
    []
  );

const removeCharFromRow = ({ lines, focusedRow, index }) =>
  lines.reduce(
    (a, line, i) =>
      i === focusedRow
        ? [
            ...a,
            getNewRow(
              `${line.value.substr(0, index - 1)}${line.value.substr(index)}`
            )
          ]
        : [...a, line],
    []
  );

/* ENTER */
const reduceKeyEnter = ({ focusedRow, index, lines, ...rest }) => {
  const nextFocusedRow = focusedRow + 1;
  const nextIndex = 0;
  const nextLines = lines.reduce(
    (a, line, i) =>
      i === focusedRow
        ? [
            ...a,
            getNewRow(line.value.substr(0, index)),
            getNewRow(line.value.substr(index))
          ]
        : [...a, line],
    []
  );
  return {
    focusedRow: nextFocusedRow,
    index: nextIndex,
    lines: nextLines,
    ...rest
  };
};

/* UTILS */
const getRow = ({ lines, focusedRow }) => lines[focusedRow];

const getRowLength = state => getRow(state).value.length;

const appendCharAtCursor = state => char =>
  state.lines.reduce(
    ({ lines, index, focusedRow, ...rest }, line, i) =>
      i === focusedRow
        ? {
            lines: [
              ...lines,
              getNewRow(
                `${line.value.substr(0, index)}${char}${line.value.substr(
                  index
                )}`
              )
            ],
            index: index + char.length,
            focusedRow,
            ...rest
          }
        : { lines: [...lines, line], index, focusedRow, ...rest },
    { ...state, lines: [] }
  );

const getNewRow = (string, old = {}) => ({
  value: string,
  tokens: getTokens_(string),
  ...old
});

export default reducer;
