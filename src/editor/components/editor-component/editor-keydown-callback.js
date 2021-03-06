import KEY from './key-bind';
import * as actions from './editor-actions';
/* */
const compose = (...opts) => (...callbacks) =>
	callbacks.reverse().reduce(
		(a, call) => e => {
			if (!call(...opts)(e)) a(e);
		},
		() => false
	);

/* */
const stopAndPrevent = e => {
	e.stopPropagation();
	e.preventDefault();
};

/* */
const isCharCode = c =>
	/^[\w-+*=/?,!;.:{}/\\$*%()"#@µ<>'~|& [\]éôêûîèäëïüöùààç]{1}$/gim.test(c); // il en manquera !

/* */
const isSelection = selection =>
	selection && selection.extent && selection.anchor;

/* */
const keyDownsuggesterProxy = (dispatch, state) => e => {
	// console.debug("%ckeyDownsuggesterProxy", "color: gold;");
	const { open, index } = state.suggesterState;
	if (open) {
		switch (e.key) {
			case KEY.ARROW_UP:
				stopAndPrevent(e);
				dispatch(actions.previousSuggestion());
				dispatch(actions.tokenizeAll());
				return true;
			case KEY.ARROW_DOWN:
				stopAndPrevent(e);
				dispatch(actions.nextSuggestion());
				return true;
			case KEY.ENTER:
				if (index > -1) {
					stopAndPrevent(e);
					dispatch(actions.suggestToken(state.suggesterState.value));
					dispatch(actions.tokenizeAll());
					return true;
				}
				return false;
			default:
				dispatch(actions.resetSuggesterIndex());
				return false;
		}
	}
	return false;
};

/* */
const keyDownCallback = (dispatch, state) => e => {
	// console.debug("%ckeyDownCallback", "color: gold;");
	if (KEY.isUnbindedKey(e.key)) return false;
	switch (e.key) {
		case KEY.ARROW_UP:
		case KEY.ARROW_DOWN:
			stopAndPrevent(e);
			dispatch({ type: e.key });
			dispatch(actions.checkIndex());
			dispatch(actions.resetPrefix());
			return true;
		case KEY.DELETE:
		case KEY.ENTER:
		case KEY.BACK_SPACE:
			stopAndPrevent(e);
			dispatch({ type: e.key });
			dispatch(actions.tokenizeAll());
			dispatch(actions.checkPrefix());
			return true;
		case KEY.PAGE_UP:
		case KEY.PAGE_DOWN:
		case KEY.TAB:
		case KEY.HOME:
		case KEY.END:
		case KEY.CONTEXT_MENU:
		case KEY.ARROW_LEFT:
		case KEY.ARROW_RIGHT:
			stopAndPrevent(e);
			dispatch({ type: e.key });
			dispatch(actions.resetPrefix());
			return true;
		default:
			if (isCharCode(e.key)) {
				stopAndPrevent(e);
				dispatch(actions.insertCharacter(e.key));
				dispatch(actions.tokenizeAll());
				// dispatch(actions.checkPrefix());
				return true;
			}
			return false;
	}
};

/* */
const keyDownWithSelection = (dispatch, state) => e => {
	// console.debug("%ckeyDownWithSelection", "color: gold;");
	if (isSelection(state.selection)) {
		switch (e.key) {
			case KEY.DELETE:
			case KEY.ENTER:
				stopAndPrevent(e);
				dispatch(actions.deleteSelection());
				dispatch({ type: KEY.ENTER });
				dispatch(actions.tokenizeAll());
				return true;
			case KEY.BACK_SPACE:
				stopAndPrevent(e);
				dispatch(actions.deleteSelection());
				dispatch(actions.tokenizeAll());
				return true;
			default: {
				if (isCharCode(e.key)) {
					stopAndPrevent(e);
					dispatch(actions.deleteSelection());
					dispatch(actions.tokenizeAll());
				}
				return false;
			}
		}
	}

	return false;
};

/* */
const keydowShorcutCallback = (dispatch, state, shortcutPatterns) => e => {
	// console.debug("%ckeydowShorcutCallback", "color: gold;");
	const { altKey, shiftKey, ctrlKey, key } = e;
	if (ctrlKey || altKey || shiftKey) {
		if (key !== KEY.ALT && key !== KEY.SHIFT && key !== KEY.CONTROL) {
			stopAndPrevent(e);
			return shortcutPatterns
				.get({ altKey, shiftKey, ctrlKey, key })
				.execute(dispatch, state);
		}
	}
	return false;
};

/* */
export default (dispatch, state, shortcutPatterns) =>
	compose(
		dispatch,
		state,
		shortcutPatterns
	)(
		keydowShorcutCallback,
		keyDownWithSelection,
		keyDownsuggesterProxy,
		keyDownCallback
	);
