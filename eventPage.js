chrome.contextMenus.removeAll(function() {
  chrome.contextMenus.create({
        id : "Add a task",
        title: "Start working on this task",
        contexts: ["selection","link"]
  });
});
chrome.contextMenus.onClicked.addListener(function(clickData){
  var taskName = '';
  var currentTasks ;
  var taskDate = new Date().getTime();
  var taskID = 0;
  
  chrome.storage.local.get(['tasks'], function (result) {
    if(result.tasks != undefined) {
      if(result.tasks.lastTaskId >0) {
        taskID = result.tasks.lastTaskId;
      }
    }
  })

  if(clickData.selectionText != undefined && clickData.selectionText.length > 0){
    taskName = clickData.selectionText;
  }
  else if(clickData.linkUrl.indexOf('jira.') > 0) {
    var jiraUrl = clickData.linkUrl.split('/')

    if(jiraUrl[3] === "browse") {
      taskName = jiraUrl[4]
    }else {
      taskName = 'New Jira Task';
      if(taskID > 0) {taskName += ' '+taskID }
    }
     
  }
  else {
    taskName = 'New Task';
    if(taskID > 0) {taskName += ' '+taskID }
  }



  chrome.storage.local.get(['tasks'], function(result) {
    currentTasks = jQuery.extend(true, {}, result.tasks);
    var newid = currentTasks.lastTaskId + 1;

    if(currentTasks.current.id != undefined &&  currentTasks.current.anyCurrent ) {
      moveToOld(currentTasks,newid)
    }

    addCurrentTask(currentTasks, taskName, taskDate, newid)
  }); 

})

  /**
   * addAsCurrent
   * @function addCurrentTask
   * @memberof popupjs
   */
  function addCurrentTask(taskObj,newTaskName,taskDate, newid) {
      taskObj.current.id = newid;
      taskObj.current.name = newTaskName;
      taskObj.current.date = taskDate;
      taskObj.current.totalSpended = 0;
      taskObj.current.anyCurrent = true;
      taskObj.lastTaskId = newid;
      chrome.storage.local.set({'tasks': taskObj});
      sendBadge();
  }

  
  /**
   * move task to old task
   * @function moveToOld
   * @memberof popupjs
   */
  function moveToOld(currentTasks, newid) {
    var now = new Date().getTime();
    var spendedTime = now - currentTasks.current.date;
    var moveToOld = {
      id : currentTasks.current.id,
      name : currentTasks.current.name,
      date : currentTasks.current.date,
      totalSpended : spendedTime,
      removed: false
    }
    currentTasks.oldTasks.push(moveToOld);
    currentTasks.lastTaskId = newid;
    chrome.storage.local.set({'tasks': currentTasks});
    sendBadge();
  }


function sendNotif(ttle,msg) {
  var notifOptions = {
      type: 'basic',
      iconUrl: '/assets/icons/icon48.png',
      title:ttle,
      message: msg
  };

  chrome.notifications.create('timeUp',notifOptions);
}

function millisToMinutesAndSeconds(millis) {
  var hrs = Math.floor(millis / (1000 * 60 * 60)).toFixed(0);
  return hrs
}


window.setInterval(function(){
  chrome.storage.local.get(['tasks'], function (result) {
    var now = new Date().getTime();
    if(result.tasks != undefined) {
      if(result.tasks.current.anyCurrent){
        timePass = (now - result.tasks.current.date) + result.tasks.current.totalSpended;
        timePass = millisToMinutesAndSeconds(timePass)
        if(timePass > 2 && timePass < 3){
          sendNotif("Good Work!","You've been working on "+result.tasks.current.name+" for 2 hours!")
        } else if(timePass > 4 && timePass < 5) {
          sendNotif("Great!","Are you still there? Cause it has been 4 hours on "+result.tasks.current.name+". Keep it up!")
        }
        else if(timePass > 6 && timePass < 7) {
          sendNotif("Don't forget","Maybe you should take a break. Do not forget stop timer while you are away.")
        }
      }
    }
  });
  chrome.notifications.clear("timeUp");
}, 3610000)

window.setInterval(function(){
  sendBadge();
}, 60100)

function setBadge(result) {
  if(result.tasks != undefined) {
    var now = new Date().getTime();
    timePass = (now - result.tasks.current.date) + result.tasks.current.totalSpended;
    var minutes = Math.floor((timePass / (1000 * 60)) % 60);
    var hrs = Math.floor(timePass / (1000 * 60 * 60)).toFixed(0);
    if(minutes < 10) {minutes = '0'+minutes;}

    if (result.tasks.current.anyCurrent) {
      chrome.browserAction.setBadgeText({"text": hrs +':'+minutes})
    }else {
      chrome.browserAction.setBadgeText({"text":"" })
    }
  }
}


function sendBadge(){
  chrome.storage.local.get(['tasks'], function(result) {
    // buraya kontrol eklenecek ilk sayfa doldurulmazsa result olmadan set etmeye calısıyor
    if(result.tasks != undefined){
      setBadge(result);
    }
  }); 
}
sendBadge();