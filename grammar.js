const PREC = {
    NONE: 0,
    IF: 1,
    OR: 2,
    AND: 3,
    EQUALITY: 4,
    COMPARISON: 5,
    RANGE: 6,
    TERM: 7,
    FACTOR: 8,
    CUSTOM: 9,
    UNARY: 10,
    CALL: 11,
    PRIMARY: 12,
};

module.exports = grammar({
    name: 'Whimsy',

    extras: $ => [
        /\s+/,
        $.comment,
    ],

    rules: {
        source_file: $ => repeat($._stmt),

        _stmt: $ => choice(
            $.const_decl, $.var_decl, $.assignment,
            $.block_stmt,
            $.expr_stmt,
            $.for_stmt,
            $.if_stmt,
            $.loop_stmt,
            $.return_stmt,
            $.empty_stmt,
        ),

        // todo - handle expr.ident :: val and expr[key] :: val
        const_decl: $ => seq($.ident, '::', $._expr),
        var_decl: $ => seq($.ident, ':=', $._expr),
        assignment: $ => seq($.ident, choice('=', '+=', '-=', '*=', '/=', '%='), $._expr),

        block_stmt: $ => seq('do', repeat($._stmt), '/do'),
        break_stmt: $ => seq('break', $._expr),
        continue_stmt: $ => seq('continue', $._expr),
        expr_stmt: $ => $._expr,
        for_stmt: $ => seq(
            'for',
            field('local', $.ident),
            'in',
            field('val', $._expr),
            field('stmt', repeat($._loop_stmts)),
            '/for'
        ),
        if_stmt: $ => seq(
            'if', field('condition', $._expr), field('if_stmt', repeat($._stmt)),
            repeat(seq('elif', field('condition', $._expr), field('elif_stmt', repeat($._stmt)))),
            optional(seq('else', field('else_stmt', repeat($._stmt)))),
            '/if',
        ),
        loop_stmt: $ => seq('loop', repeat($._loop_stmts), '/loop'),
        _loop_stmts: $ => choice($._stmt, $.break_stmt, $.continue_stmt),
        return_stmt: $ => seq('return', $._expr),

        empty_stmt: $ => ';',

        _expr: $ => choice(
            $.if_expr,
            $.logic_or,
            $.logic_and,
            $.equality,
            $.comparison,
            $.range,
            $.term,
            $.factor,
            $.unary,
            $.call,
            $._primary,
        ),

        if_expr: $ => prec(PREC.IF, seq(
            'if',
            field('condition', $._expr),
            optional(';'),
            field('val', $._expr),
            repeat(seq(
                'elif',
                field('elif_cond', $._expr),
                optional(';'),
                field('elif_val', $._expr))),
            'else',
            field('else_val', $._expr),
        )),
        logic_or: $ => prec.left(PREC.OR, seq($._expr, 'or', $._expr)),
        logic_and: $ => prec.left(PREC.AND, seq($._expr, 'and', $._expr)),
        equality: $ => prec.left(PREC.EQUALITY, seq($._expr, choice('==', '!='), $._expr)),
        comparison: $ => prec.left(PREC.COMPARISON, seq($._expr, choice('<', '<=', '>', '>=', 'is'), $._expr)),
        range: $ => prec.left(PREC.RANGE, seq(
            field('start', $._expr),
            choice('..', '..='),
            field('end', $._expr),
            optional(seq('by', field('step', $._expr)))
        )),
        term: $ => prec.left(PREC.TERM, seq($._expr, choice('+', '-'), $._expr)),
        factor: $ => prec.left(PREC.FACTOR, seq($._expr, choice('*', '/', '%'), $._expr)),
        // todo - custom
        unary: $ => prec(PREC.UNARY, seq(choice('!', '-'), $._expr)),
        call: $ => prec(PREC.CALL, seq($._expr,
            choice(
                seq('(', optional($.arguments), ')'),
                seq('.', choice($.ident, $.string)),
                seq(':', choice($.ident, $.string), '(', optional($.arguments), ')'),
                seq('[', $._expr, ']'),
            ),
        )),

        _primary: $ => prec(PREC.PRIMARY, choice(
            $.constant,
            $.number, $.string, $.ident,
            $._paren,
            $.class,
            $.function,
            // | list
            // | map
            $.set,
        )),

        constant: $ => choice('true', 'false', 'nil'),
        number: $ => choice(
            /0[bB][01_]+(?:\.[01_]+)?/,
            /0[oO][0-7_]+(?:\.[0-7_]+)?/,
            /[0-9_]+(?:\.[0-9_]+)?/,
            /0[xX][0-9a-fA-F_]+(?:\.[0-9a-fA-F_]+)?/,
        ),
        // todo - escaped quotes
        string: $ => choice(
            /"[^"]*"/,
            /'[^']*'/,
        ),
        // todo - keywords shouldn't match ident
        ident: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,
        _paren: $ => seq('(', $._expr, ')'),
        class: $ => seq(
            'class',
            optional(seq('is', field('parent', $._expr))),
            field('stmt', repeat($._stmt)),
            '/class'
        ),
        function: $ => seq('fn', '(', optional($.parameters), ')', repeat($._stmt), '/fn'),

        // list -> "(" ((expression ",") | (expression ("," expression)+ ","?))? ")"
        // map -> "[" (expression ("::" | ":=") expression ("," expression ("::" | ":=") expression)* ","?)? "]"
        set: $ => seq('[', $._expr, repeat(seq(',', $._expr)), optional(','), ']'),

        parameters: $ => seq($.ident, repeat(seq(',', $.ident)), optional(',')),
        arguments: $ => prec(1, seq($._expr, repeat(seq(',', $._expr)), optional(','))),

        comment: $ => seq('#', /[^\r\n]*/),
    }
});
