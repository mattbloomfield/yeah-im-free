let API_KEY;
const DISCOVERY_DOCS = [
  "https://sheets.googleapis.com/$discovery/rest?version=v4",
];

const getToken = () => {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (!token) reject();
      else resolve(token);
    });
  });
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  getToken()
    .then((token) => {
      sendResponse({ token: token });
    })
    .catch((e) => {
      console.log("error", e);
    });
  return true;
});
