const lightTheme = "assets/css/light.css";
const darkTheme = "assets/css/dark.css";
const mainTheme = "assets/css/main.css";
const sunIcon = "assets/imgs/svgs/SunIcon.svg";
const moonIcon = "assets/imgs/svgs/MoonIcon.svg";
const cloudIcon = "assets/imgs/svgs/cloud.svg";
const headers =  document.getElementById('accomplishments');
const themeIcon = document.getElementById("doc-icon");
const msidew = document.getElementById("mainSidebar");
const menuicon = document.getElementById("motionbutton");
let movement = 0;


function NavControl() {
  if (movement==0) {
    menuicon.innerHTML="&#9776;";
    menuicon.style.top = "101px";
    menuicon.style.left = "2%";
    msidew.style.width = "0";
    document.getElementById("top-wrapper").style.marginLeft = "0";
    document.getElementById("main-wrapper").style.marginLeft = "0";
    document.getElementById("footer-wrapper").style.marginLeft = "0";
    movement=1;
  } else {
    menuicon.innerHTML = "&times;";
    menuicon.style.top = "10%";
    menuicon.style.left = "11%";
    msidew.style.width = "16%";
	  document.getElementById("top-wrapper").style.marginLeft = "15%";
	  document.getElementById("main-wrapper").style.marginLeft = "15%";
	  document.getElementById("footer-wrapper").style.marginLeft = "15%";
    movement=0;
  }
}

function changeTheme() {
  const theme = document.getElementById("doc-theme");
  if (theme.getAttribute("href") === mainTheme) {
    theme.setAttribute("href", lightTheme);
    themeIcon.setAttribute("src", sunIcon);
  } else if (theme.getAttribute("href") === lightTheme) {
    theme.setAttribute("href", darkTheme);
    themeIcon.setAttribute("src", moonIcon);
  } else {
    theme.setAttribute("href", mainTheme);
    themeIcon.setAttribute("src", cloudIcon);
  }
}

function hidescrollheader() {
  const scrollY = window.scrollY;
  const windowHeight = window.innerHeight;
  const docHeight = document.documentElement.scrollHeight;
  const atBottom = scrollY + windowHeight >= docHeight - 5;

  if (atBottom) {
      headers.style.transform="translateY(-100%)";
      headers.style.opacity = "0";
      headers.style.transition= "transform 0.4s ease, opacity 0.4s ease";
  } else {
      headers.style.transform = "translateY(0)";
      headers.style.opacity = "1";
      headers.style.transition = "transform 0.4s ease, opacity 0.4s ease";
  }
}
window.addEventListener("scroll", hidescrollheader);