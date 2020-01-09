import { VtlVisitor, VtlParser } from '../../antlr-tools';
import ArithmeticVisitor from './Arithmetic';
import BooleanAlgebraVisitor from './BooleanAlgebra';
import IfThenElse from './IfThenElse';
import VariableVisitor from './Variable';
import LiteralVisitor from './Literal';
import ComparisonVisitor from './Comparison';
import {
	CastVisitor,
	ConcatenationVisitor,
	NumericFunctionsVisitor,
	StringFunctionsVisitor,
} from './functions';

class ExpressionVisitor extends VtlVisitor {
	constructor(bindings) {
		super();
		this.bindings = bindings;
		this.arithmeticVisitor = new ArithmeticVisitor(this);
		this.booleanAlgebraVisitor = new BooleanAlgebraVisitor(this);
		this.castFunctionVisitor = new CastVisitor(this);
		this.comparisonVisitor = new ComparisonVisitor(this);
		this.concatenationVisitor = new ConcatenationVisitor(this);
		this.ifThenElseVisitor = new IfThenElse(this);
		this.literalVisitor = new LiteralVisitor();
		this.numericFunctionVisitor = new NumericFunctionsVisitor(this);
		this.stringFunctionVisitor = new StringFunctionsVisitor(this);
		this.variableVisitor = new VariableVisitor(this.bindings);
	}

	visitComparisonExpr = ctx => this.comparisonVisitor.visit(ctx);

	// Since the grammar groups the binary expression we need to "route" to our
	// own visitor groups.
	visitArithmeticExpr = ctx => this.arithmeticVisitor.visit(ctx);
	visitArithmeticExprOrConcat = ctx => {
		const { op } = ctx;
		if (op.type === VtlParser.CONCAT)
			return new ConcatenationVisitor(this).visit(ctx);
		else return this.arithmeticVisitor.visit(ctx);
	};

	visitUnaryExpr = ctx => {
		const { op } = ctx;
		if (op.type === VtlParser.NOT) return this.booleanAlgebraVisitor.visit(ctx);
		else return this.arithmeticVisitor.visit(ctx);
	};

	visitBooleanExpr = ctx => this.booleanAlgebraVisitor.visit(ctx);

	visitParenthesisExpr = ctx => this.visit(ctx.expr());

	visitIfExpr = ctx => this.ifThenElseVisitor.visit(ctx);

	// TODO: Optional expression should handle missing values.
	visitOptionalExpr = ctx =>
		ctx.expr() === null ? null : this.visit(ctx.expr());
	visitFunctionsExpression = ctx => this.visit(ctx.functions());
	visitGenericFunctions = ctx => this.visit(ctx.genericOperators());

	visitVarIdExpr = ctx => this.variableVisitor.visit(ctx);

	visitConstantExpr = ctx => this.literalVisitor.visit(ctx);

	// Functions
	visitCastExprDataset = ctx => this.castFunctionVisitor.visit(ctx);
	visitConcatExpr = ctx => this.concatenationVisitor.visit(ctx);
	visitStringFunctions = ctx =>
		this.stringFunctionVisitor.visit(ctx.stringOperators());
	visitNumericFunctions = ctx =>
		this.numericFunctionVisitor.visit(ctx.numericOperators());
}

export default ExpressionVisitor;