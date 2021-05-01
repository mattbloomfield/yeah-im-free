("use strict");

console.log("loaded content script");

const scriptLoaderId = setInterval(() => {
  if (!document.head) {
    return;
  }

  clearInterval(scriptLoaderId);
  getToken();
  retrieveOptions();
  addScript("dist/gmailJsLoader.js");
  addScript("dist/extension.js");
}, 100);

function addScript(src) {
  const script = document.createElement("script");
  script.type = "text/javascript";
  script.src = chrome.extension.getURL(src + `?v=${new Date().getTime()}`);
  document.head.appendChild(script);
}

function getToken() {
  chrome.runtime.sendMessage({ requestType: "getToken" }, function (response) {
    console.log(response.token);
    document.head.dataset.googleCalToken = response.token;
  });
}

function retrieveOptions() {
  chrome.storage.sync.get(
    {
      minMeetingLength: "30",
      startTime: "9:00",
      endTime: "17:00",
      bufferLength: "0",
    },
    function (options) {
      console.log("getting options", options);
      document.head.dataset.yifOptions = JSON.stringify(options);
    }
  );
}
