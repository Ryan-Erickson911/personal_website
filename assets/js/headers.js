// Cache offsets
let topOffset = [];
const $headers = $('.scrollheader');
const menu = document.getElementById("mainmenu");

function updateOffsets() {
    topOffset = [];
    $headers.each(function () {
        topOffset.push($(this).offset().top);
    });
}

function scrollFunction() {
    const menuHeight = menu ? menu.offsetHeight : 0;
    const scrollTop = $(window).scrollTop();
    const headerCount = $headers.length;
    let scrolled = false;

    $headers.each(function (index) {
        const $this = $(this);
        const elementHeight = $this.outerHeight();
        const elementWidth = $this.outerWidth();
        const elementLeft = $this.offset().left;

        const $next = index < headerCount - 1 ? $headers.eq(index + 1) : null;
        const nextHeight = $next ? $next.outerHeight() : 0;

        const currentTop = topOffset[index];
        const nextTop = topOffset[index + 1] ?? Infinity;

        if (scrollTop + menuHeight >= currentTop && scrollTop + menuHeight < nextTop) {
            scrolled = true;

            if (scrollTop + menuHeight >= nextTop - elementHeight) {
                $this.css({
                    position: "fixed",
                    top: -(scrollTop + menuHeight - (nextTop - elementHeight)),
                    width: elementWidth,
                });

                if ($next) {
                    $next.css({
                        position: "fixed",
                        top: nextTop - scrollTop - menuHeight,
                        width: $next.outerWidth()
                    });
                }

                $('body').css({ "padding-top": elementHeight + nextHeight});
                return false;
            }

            $this.css({
                position: "fixed",
                top: menuHeight,
                width: elementWidth
            });

            if ($next) {
                $next.css({ position: "static", width: "", left: "" , right: ""});
            }

            $('body').css({ "padding-top": elementHeight });
        } else {
            $this.css({ position: "static", width: "", left: "", right: ""});
        }
    });
    if (!scrolled) {
        $('body').css({ "padding-top": 0 });
    }
}
$(function () {
    updateOffsets();
    $(window).on('resize', updateOffsets);
    $(window).on('scroll', scrollFunction);
});
