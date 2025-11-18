const lightTheme = "assets/css/light.css";
const darkTheme = "assets/css/dark.css";
const sunIcon = "assets/imgs/svgs/SunIcon.svg";
const moonIcon = "assets/imgs/svgs/MoonIcon.svg";
const cloudIcon = "assets/imgs/svgs/cloud.svg";
const headers =  document.getElementById('accomplishments');
const themeIcon = document.getElementById("doc-icon");

function changeTheme() {
  const theme = document.getElementById("doc-theme");
  if (theme.getAttribute("href") === lightTheme) {
    theme.setAttribute("href", darkTheme);
    themeIcon.setAttribute("src", sunIcon);
    toast.innerHTML = "Dark ";
  } else {
    theme.setAttribute("href", lightTheme);
    themeIcon.setAttribute("src", moonIcon);
    toast.innerHTML = "Light";
  }
}

function hidescrollheader() {
  const scrollY = window.scrollY || window.pageYOffset;
  const windowHeight = window.innerHeight;
  const docHeight = document.documentElement.scrollHeight;
  const atBottom = scrollY + windowHeight >= docHeight - 5;

  if (atBottom) {
      headers.css({
          transform: "translateY(-100%)",
          opacity: "0",
          transition: "transform 0.4s ease, opacity 0.4s ease"
      });
      return;
  } else {
      headers.css({
          transform: "translateY(0)",
          opacity: "1",
          transition: "transform 0.4s ease, opacity 0.4s ease"
      });
  }
}

$(function () {
    $(window).on('scroll', hidescrollheader);
});