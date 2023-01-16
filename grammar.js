module.exports = grammar({
    name: 'Whimsy',

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
        for_stmt: $ => seq('for', $.ident, 'in', $._expr, repeat($._loop_stmts), '/for'),
        if_stmt: $ => seq(
            'if', $._expr, repeat($._stmt),
            repeat(seq('elif', $._expr, repeat($._stmt))),
            optional(seq('else', repeat($._stmt))),
            '/if',
        ),
        loop_stmt: $ => seq('loop', repeat($._loop_stmts), '/loop'),
        _loop_stmts: $ => choice($._stmt, $.break_stmt, $.continue_stmt),
        return_stmt: $ => seq('return', $._expr),

        empty_stmt: $ => ';',

        _expr: $ => choice(
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

        logic_or: $ => prec.left(1, seq($._expr, 'or', $._expr)),
        logic_and: $ => prec.left(2, seq($._expr, 'and', $._expr)),
        equality: $ => prec.left(3, seq($._expr, choice('==', '!='), $._expr)),
        comparison: $ => prec.left(4, seq($._expr, choice('<', '<=', '>', '>=', 'is'), $._expr)),
        range: $ => prec.left(5, seq($._expr, choice('..', '..='), $._expr, optional(seq('by', $._expr)))),
        term: $ => prec.left(6, seq($._expr, choice('+', '-'), $._expr)),
        factor: $ => prec.left(7, seq($._expr, choice('*', '/', '%'), $._expr)),
        // todo - custom, prec 8
        unary: $ => prec(9, seq(choice('!', '-'), $._expr)),
        call: $ => prec(10, seq($._expr,
            repeat1(choice(
                seq('(', optional($.arguments), ')'),
                seq('.', choice($.ident, $.string)),
                seq(':', choice($.ident, $.string), '(', optional($.arguments), ')'),
                seq('[', $._expr, ']'),
            )),
        )),

        _primary: $ => prec(11, choice(
            $.constant,
            $.number, $.string, $.ident,
            $.paren,
            $.if_expr,
            $.class,
            $.function,
            // | list
            // | map
            // | set
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
        ident: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,
        paren: $ => seq('(', $._expr, ')'),
        if_expr: $ => prec(12, seq(
            'if', $._expr, optional(';'), $._expr,
            repeat(seq('elif', $._expr, optional(';'), $._expr)),
            'else', $._expr,
        )),
        class: $ => seq('class', optional(seq('is', $._expr)), repeat($._stmt), '/class'),
        function: $ => seq('fn', '(', optional($.parameters), ')', repeat($._stmt), '/fn'),
        //         list -> "(" ((expression ",") | (expression ("," expression)+ ","?))? ")"
        //             map -> "[" (expression ("::" | ":=") expression ("," expression ("::" | ":=") expression)* ","?)? "]"
        //             set -> "[" expression ("," expression)* ","? "]"

        parameters: $ => seq($.ident, repeat(seq(',', $.ident)), optional(',')),
        arguments: $ => prec(12, seq($._expr, repeat(seq(',', $._expr)), optional(','))),
    }
});
