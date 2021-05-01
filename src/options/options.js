// Saves options to chrome.storage
function save_options() {
  var minMeetingLength = document.getElementById("MinimumMeetingLength").value;
  var startTime = document.getElementById("StartTime").value;
  var endTime = document.getElementById("EndTime").value;
  var bufferLength = document.getElementById("BufferLength").value;
  chrome.storage.sync.set(
    {
      minMeetingLength: minMeetingLength,
      startTime: startTime,
      endTime: endTime,
      bufferLength: bufferLength,
    },
    function () {
      // Update status to let user know options were saved.
      var status = document.getElementById("Status");
      status.textContent = "Options saved.";
      setTimeout(function () {
        status.textContent = "";
      }, 750);
    }
  );
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get(
    {
      minMeetingLength: "30",
      startTime: "9:00",
      endTime: "17:00",
      bufferLength: "0",
    },
    function (items) {
      document.getElementById("MinimumMeetingLength").value =
        items.minMeetingLength;
      document.getElementById("StartTime").value = items.startTime;
      document.getElementById("EndTime").value = items.endTime;
      document.getElementById("BufferLength").value = items.bufferLength;
    }
  );
}
document.addEventListener("DOMContentLoaded", restore_options);
document
  .getElementById("SaveOptionsBtn")
  .addEventListener("click", save_options);
