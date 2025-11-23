const lightTheme = "assets/css/light.css";
const darkTheme = "assets/css/dark.css";
const mainTheme = "assets/css/main.css";
const sunIcon = "assets/imgs/svgs/SunIcon.svg";
const moonIcon = "assets/imgs/svgs/MoonIcon.svg";
const cloudIcon = "assets/imgs/svgs/cloud.svg";
const themeIcon = document.getElementById("doc-icon");
const msidew = document.getElementById("mainSidebar");
const menuicon = document.getElementById("motionbutton");
let movement = 1;

function NavControl() {
  if (movement==1) {
    menuicon.innerHTML="&#9776;";
    menuicon.style.top="101px";
    menuicon.style.left="2%";
    msidew.classList.add("hidden");
    msidew.classList.remove("visible");
    document.getElementById("top-wrapper").style.marginLeft="0%";
    document.getElementById("main-wrapper").style.marginLeft="0%";
    document.getElementById("footer-wrapper").style.marginLeft="0%";
    return movement=0;
  } else {
    menuicon.innerHTML = "&times;";
    menuicon.style.top="150px";
    menuicon.style.left="10%";

    msidew.classList.remove("hidden");
    msidew.classList.add("visible");

	  document.getElementById("top-wrapper").style.marginLeft="15%";
	  document.getElementById("main-wrapper").style.marginLeft="15%";
	  document.getElementById("footer-wrapper").style.marginLeft="15%";
    return movement=1;
  }
}

function checkmargins() {
  // If the sidebar is open but the screen shrinks / scroll changes layout:
  if (movement === 1 && window.innerWidth < 737) {
    // Force close sidebar
    NavControl();
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
  let headers =  document.getElementById('scrollheader');
  let scrollY = window.scrollY;
  let docHeight = document.documentElement.scrollHeight;
  let atBottom = scrollY >= docHeight - 5;

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
window.addEventListener("resize", checkmargins);
menuicon.onclick= NavControl;