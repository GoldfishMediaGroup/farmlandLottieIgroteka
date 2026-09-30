(function ($) {

    var methods = {
        init: function (options) {
            return this.each($.proxy(_attacheHandlers, this));
        }
    };

    var _attacheHandlers = function (index, input) {
        $(input).parent().children('.quantity-plus')
            .off('click.pluser', $.proxy(_Push, this))
            .on('click.pluser', $.proxy(_Push, this));

        $(input).parent().children('.quantity-minus')
            .off('click.pluser', $.proxy(_Pull, this))
            .on('click.pluser', $.proxy(_Pull, this));

        $(input).on('keyup.pluser blur.pluser', function (event) {
            $(this).val($(this).val().replace(/[^\d].+/, ""));
            if ((event.which < 48 || event.which > 57)) {
                event.preventDefault();
            }
        });

        $(input).on('keyup.pluser blur.pluser', $.proxy(_onChangeInput, this));

        _actualBtn(this, $(input), false, false);
    };

    var _Push = function(e) {
        var input = $(e.currentTarget).parent().children('.quantity-input'),
            value = parseInt(input.val()) || 0,
            max = input.data('max');

        // form
        var quantities = $(e.currentTarget).closest('form').children('.quantity');
        quantities.each(function() {
            var newValue = parseInt($(this).val()) + 1,
                maxValue =  $(this).data('max');
            if(newValue <= maxValue) {
                $(this).val(newValue);
                return false;
            }
        });

        // view
        if ((value + 1) > max) {
            input.val(max);
        } else {
            input.val(value + 1);
        }

        _actualBtn(this, input, false, true);
    };

    var _Pull = function(e) {
        var input = $(e.currentTarget).parent().children('.quantity-input'),
            value = parseInt(input.val()) || 0,
            min = 1;

        // form
        var quantities = $($(e.currentTarget).closest('form').children('.quantity').get().reverse());
        quantities.each(function() {
            var newValue = parseInt($(this).val()) - 1,
                minValue = $(this).data('min');
            if(newValue >= minValue) {
                $(this).val(newValue);
                return false;
            }
        });

        // view
        if ((value - 1) < min) {
            input.val(min);
        } else {
            input.val(value - 1);
        }

        _actualBtn(this, input, false, true);
    };

    var _actualBtn = function ($this, input, change, showTooltip) {
        var minus = input.parent().children('.quantity-minus'),
            plus = input.parent().children('.quantity-plus'),
            value = parseInt(input.val()) || 0,
            max = input.data('max'),
            min = 1;

        if (value <= min) {
            input.val(min);
            // form
            if(change) {
                var quantities = input.closest('form').children('.quantity');
                quantities.each(function() {
                    var minValue =  $(this).data('min');
                     $(this).val(minValue);
                });
            }
            setTimeout(function() {
                minus.attr('disabled', true);
            }, 100);

        } else {
            minus.attr('disabled', false);
        }

        if (value >= max)  {
            input.val(max);
            if (showTooltip) {
                input.parent().tooltip('show');
                setTimeout(function(){
                    input.parent().tooltip('hide');
                }, 2000);
            }
            // form
            if(change) {
                var quantities = input.closest('form').children('.quantity');
                quantities.each(function() {
                    var maxValue =  $(this).data('max');
                     $(this).val(maxValue);
                });
            }
            setTimeout(function() {
                plus.attr('disabled', true);
            }, 100);
        } else {
            plus.attr('disabled', false);
        }

        if(change) {
            if (value > min && value < max) {
                var setMin = false;
                var quantities = input.closest('form').children('.quantity');
                quantities.each(function() {
                    var minValue =  $(this).data('min');
                    var maxValue =  $(this).data('max');
                    if(setMin) {
                        value = minValue;
                    } else {
                        if(value <= maxValue) {
                            $(this).val(value);
                            setMin = true;
                        } else {
                            $(this).val(maxValue);
                            value = value - maxValue;
                        }
                    }
                });

            }
        }
    };

    var _onChangeInput = function (e) {
        _actualBtn(this, $(e.currentTarget), true, true);
    }

    $.fn.quantityPluser = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Метод "' + method + '" не найден.');
        }
    };

})(jQuery);
