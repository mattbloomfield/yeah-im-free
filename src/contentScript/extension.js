console.log("loaded extension code");
const loaderId = setInterval(() => {
  if (!window._gmailjs) {
    return;
  }

  clearInterval(loaderId);
  startExtension(window._gmailjs);
}, 100);

function startExtension(gmail) {
  console.log("Extension loading...");
  window.gmail = gmail;

  gmail.observe.on("compose", (compose, composeType) => {
    // compose type can be one of "reply" | "forward" | "compose"
    const sendButton = compose.dom("send_button");
    const toolbar = sendButton.closest("tr");
    console.log("toolbar", toolbar);
    const td = document.createElement("td");
    const button = document.createElement("button");
    button.id = "AddAvailabilityButton";
    button.innerHTML = "Add Availability";
    button.style.borderColor = "#53B7A2";
    button.style.borderWidth = "1px";
    button.style.borderStyle = "solid";
    button.style.borderRadius = "4px";
    button.style.marginLeft = "4px";
    button.style.backgroundColor = "#63C7B2";
    button.style.color = "#fff";
    button.addEventListener("click", async (ev) => {
      const availability = await getAvailability();
      const text = formatAvailability(availability);
      console.log(text);
      const currentBody = compose.body();
      console.log("currentBody", currentBody);
      // inserting text is really hard here and we should use a library to parse the HTML correctly. This is pretty brittle
      const signMatch = /<div><div dir="ltr" class="gmail_signature"/; // match the group
      let newBody = currentBody.replace(
        signMatch,
        (match) => `<div>${text}</div><br>${match}`
      );
      compose.body(newBody);
    });
    td.appendChild(button);
    toolbar[0].appendChild(td);
  });
}

const retrieveOptions = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(
      ["startTime", "endTime", "blackouts", "minMeetingLength", "bufferLength"],
      function (options) {
        options.blackouts = JSON.parse(options.blackouts);
        resolve(options);
      }
    );
  });
};

const formatAvailability = (availability = []) => {
  let str = "";
  if (availability.length == 0) {
    return "Unfortunately, I don't have any time today.";
  }
  str += "It looks like I have time ";
  availability.forEach((timeslot, index) => {
    str += `from ${formatTime(timeslot.start)} to ${formatTime(timeslot.end)}`;
    if (index === availability.length - 1) {
      str += `.`;
    } else if (index === availability.length - 2) {
      str += ` and `;
    } else {
      str += `, `;
    }
  });
  return str;
};

const formatTime = (time = new Date()) => {
  let hours = time.getHours();
  let minutes = time.getMinutes();
  let suffix = "AM";
  if (hours > 12) {
    hours = hours - 12;
  }
  if (minutes < 10) {
    minutes = `0${minutes}`;
  }
  if (hours >= 12) {
    suffix = "PM";
  }
  let str = `${hours}:${minutes} ${suffix}`;
  return str;
};

const getAvailability = async () => {
  let options = document.head.dataset.yifOptions;
  console.log("options", options);
  options = JSON.parse(options);
  const startTime = options.startTime;
  const endTime = options.endTime;
  // const blackouts = options.blackouts;
  const minMeetingLength = options.minMeetingLength;
  const bufferLength = options.bufferLength;

  const startDate = new Date();
  const endDate = new Date();
  // for now check only today
  startDate.setHours(startTime.split(":")[0], startTime.split(":")[1], 0, 0);
  endDate.setHours(endTime.split(":")[0], endTime.split(":")[1], 59, 999);
  // get events from google calendar
  const busyTimes = await getBusyTimes(startDate, endDate);

  const availableTimes = [];
  let latestTime = startDate;
  busyTimes.forEach((event) => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    const eventStartAdjusted = new Date(
      eventStart.getTime() - bufferLength * 60000
    );
    const eventEndAdjusted = new Date(
      eventEnd.getTime() + bufferLength * 60000
    );

    console.log("latestTime", latestTime);
    console.log("eventStart", eventStart);
    console.log("eventEnd", eventEnd);
    console.log("eventStartAdjusted", eventStartAdjusted);
    console.log("eventEndAdjusted", eventEndAdjusted);

    if (eventStartAdjusted > latestTime) {
      availableTimes.push({
        start: latestTime,
        end: eventStartAdjusted,
      });
    }
    latestTime = eventEndAdjusted;
  });
  if (latestTime < endDate) {
    availableTimes.push({
      start: latestTime,
      end: endDate,
    });
  }
  return availableTimes;
};

const getBusyTimes = (startDate = new Date(), endDate = new Date()) => {
  return new Promise(async (resolve, reject) => {
    const token = document.head.dataset.googleCalToken;
    const url = `https://www.googleapis.com/calendar/v3/freeBusy?access_token=${token}`;
    const requestBody = {
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      items: [
        {
          id: "primary",
        },
      ],
    };
    const response = await postData(url, requestBody);
    console.log("response", response);
    resolve(response.calendars.primary.busy);
  });
};

async function postData(url = "", data = {}) {
  const response = await fetch(url, {
    method: "POST",
    cache: "no-cache",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return response.json();
}
