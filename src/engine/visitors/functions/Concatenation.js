import {
	VtlParser,
	VtlVisitor,
} from '../../../antlr-tools/vtl-2.0-Insee/parser-vtl';

class ConcatenationVisitor extends VtlVisitor {
	constructor(exprVisitor) {
		super();
		this.exprVisitor = exprVisitor;
	}

	visitConcatExpr = ctx => {
		const { left, right } = ctx;
		const leftOperand = this.exprVisitor.visit(left);
		const rightOperand = this.exprVisitor.visit(right);

		if (
			leftOperand.type !== rightOperand.type ||
			rightOperand.type !== VtlParser.STRING_CONSTANT
		) {
			throw new Error(
				`cannot concat ${left.getText()} with ${right.getText()}`
			);
		}
		return {
			resolve: bindings =>
				leftOperand.resolve(bindings) + rightOperand.resolve(bindings),
			type: leftOperand.type, // invariant because of type check above.
		};
	};
}

export default ConcatenationVisitor;