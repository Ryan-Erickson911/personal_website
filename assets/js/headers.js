let topOffset = [];
const $headers = $('.scrollheader');
const menu = document.getElementById("mainmenu");

function updateOffsets() {
    topOffset = [];
    $headers.each(function () {
        topOffset.push($(this).offset().top);
    });
}

function handleScroll() {   
    const menuHeight = menu ? menu.offsetHeight : 0;
    const scrollTop = $(window).scrollTop();
    const headerCount = $headers.length;
    let scrolled = false;

    const scrollY = window.scrollY || window.pageYOffset;
    const windowHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    const atBottom = scrollY + windowHeight >= docHeight - 5;

    if (atBottom) {
        $headers.css({
            transform: "translateY(-100%)",
            opacity: "0",
            transition: "transform 0.4s ease, opacity 0.4s ease"
        });
        return;
    } else {
        $headers.css({
            transform: "translateY(0)",
            opacity: "1",
            transition: "transform 0.4s ease, opacity 0.4s ease"
        });
    }

    $headers.each(function (index) {
        const $this = $(this);
        const elementHeight = $this.outerHeight();
        const elementWidth = $this.outerWidth();

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
                        width: $next.outerWidth()
                    });
                }

                $('body').css({ "padding-top": elementHeight + nextHeight - menuHeight});
                return false;
            }

            $this.css({
                position: "fixed",
                top: menuHeight-0.5,
                width: elementWidth
            });

            if ($next) {
                $next.css({ position: "static",top: menuHeight, width: "", left: "", right: "" });
            }

            $('body').css({ "padding-top": elementHeight + menuHeight });
        } else {
            $this.css({ position: "static",top: menuHeight, width: "", left: "", right: "" });
        }
    });

    if (!scrolled) {
        $('body').css({ "padding-top": 0 });
    }
}

$(function () {
    updateOffsets();
    $(window).on('resize', updateOffsets);
    $(window).on('scroll', handleScroll);
});