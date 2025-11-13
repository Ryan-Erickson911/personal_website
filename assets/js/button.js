const lightTheme = "assets/css/light.css";
const darkTheme = "assets/css/dark.css";
const mainTheme = "assets/css/main.css";
const sunIcon = "assets/imgs/svgs/SunIcon.svg";
const moonIcon = "assets/imgs/svgs/MoonIcon.svg";
const cloudIcon = "assets/imgs/svgs/cloud.svg";
const themeIcon = document.getElementById("doc-icon");
let mybutton = document.getElementById("myBtn");

function ButtonScrollFunction() {
  if (document.body.scrollTop > 10 || document.documentElement.scrollTop > 10) {
    mybutton.style.display = "block";
  } else {
    mybutton.style.display = "none";
  }
}

function topFunction() {
  document.body.scrollTop = 0; 
  document.documentElement.scrollTop = 0; 
}

function changeDocTheme() {
  const doctheme = document.getElementById("doc-theme");
  if (doctheme.getAttribute("href") === mainTheme) {
    doctheme.setAttribute("href", lightTheme);
    themeIcon.setAttribute("src", sunIcon);
  } else if (doctheme.getAttribute("href") === lightTheme) {
    doctheme.setAttribute("href", darkTheme);
    themeIcon.setAttribute("src", moonIcon);
  } else {
    doctheme.setAttribute("href", mainTheme);
    themeIcon.setAttribute("src", cloudIcon);
  }
}

window.onscroll = function() {ButtonScrollFunction()};