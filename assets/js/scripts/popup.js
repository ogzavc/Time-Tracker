$(document).ready(function () {

    /**
    * check if darkMode
    * @function darkModeCheck
    * @memberof popupjs
    */
   function darkModeCheck() {
    chrome.storage.local.get(['options'], function (result) {
        if (result.options != undefined) {
           if(result.options.darkMode == 1){
                $('body').addClass('dark')	
           }
        }
    });
    }
    darkModeCheck();

    /**
    * check if info filled
    * @function checkInfo
    * @memberof popupjs
    */
    function checkInfo() {
        chrome.storage.local.get(['personalInfo'], function (result) {
            if (result.personalInfo == undefined) {
                $('.js-first-page').removeClass('hidden');
            }
        });
    }
    checkInfo();

    /**
     * checkbox change dev or test
     * @function checkPosition
     * @memberof popupjs
     */
    function checkPosition() {
        $('.js-position-checkbox').change(function () {
            if ($(this).is(':checked')) {
                $('.position-test').addClass('active')
                $('.position-dev').removeClass('active')
            } else {
                $('.position-dev').addClass('active')
                $('.position-test').removeClass('active')
            }
        })
    }
    checkPosition();

    /**
     * teamname changes
     * @function checkTeamName
     * @memberof popupjs
     */
    var displayedTeamNameDefault = $('.js-displayed-team-name').text();
    function checkTeamName() {
        $('.js-team-name').keyup(function () {
            $('.js-displayed-team-name').text(displayedTeamNameDefault + $(this).val());
        })
    }
    checkTeamName();

    /**
    * save first page infos
    * @function saveInfo
    * @memberof popupjs
    */
    function saveInfo() {
        var pos = 0;
        var teamName = '';
        var sprintTime = '';

        $('.js-save-info').click(function () {

            if ($('.js-position-checkbox').is(':checked')) {
                pos = 1;
            }
            if ($('.js-team-name').val().length > 0) {
                teamName = $('.js-team-name').val();
            }
            if (document.querySelector('input[name="rb"]:checked')) {
                sprintTime = parseInt(document.querySelector('input[name="rb"]:checked').value);
            }

            saveInfos(pos, teamName, sprintTime)

        })
    }
    saveInfo();


    /**
     * skip first page infos
     * @function skipInfo
     * @memberof popupjs
     */
    function skipInfo() {
        $('.js-skip-info').click(function () {
            saveInfos('', '', '');
        })
    }
    skipInfo();


    /**
     * save or skip 
     * @function saveInfos
     * @memberof popupjs
     */
    function saveInfos(pos, teamName, sprintTime) {
        var inf = {
            position: pos,
            teamsName: teamName,
            sprintWeeks: sprintTime
        }
        chrome.storage.local.set({ 'personalInfo': inf });

        var tasks = {
            current: {
                anyCurrent: false
            },
            oldTasks: [],
            lastTaskId: 0
        }
        chrome.storage.local.set({ 'tasks': tasks }, function () {
            $('.js-first-page').addClass('hidden');
            $('.js-work-content').removeClass('hidden');
            checkTasks();
        });
    }


    /**
     * check if there is a current task
     * @function checkTasks
     * @memberof popupjs
     */
    function checkTasks() {
        chrome.storage.local.get(['tasks'], function (result) {
            if (result.tasks != undefined) {
                $('.js-work-content').removeClass('hidden');
                if (result.tasks.lastTaskId == 0) {
                    $('.js-noTask').removeClass('hidden');
                    $('.js-hasTask').addClass('hidden');
                } else if (result.tasks.lastTaskId > 0) {
                    $('.js-footer').removeClass('hidden');
                } 

                if (result.tasks.oldTasks.length > 1) {
                    $('.js-previousTasksText').removeClass('hidden')
                }
            }
        });
    }
    checkTasks();

    chrome.storage.onChanged.addListener(function (changes) {
        if(changes.tasks != undefined) {
            var changedTasks = changes.tasks.newValue;
            if (!changedTasks.current.anyCurrent) {
                $('.js-has-working-task').addClass('hidden');
                $('.js-no-working-task').removeClass('hidden');
            }
            else {
                currentTaskInfo(changedTasks)
            }
        }
    });

    /**
    * list tasks when extension opened
    * @function listTasks
    * @memberof popupjs
    */
    function listTasks() {
        chrome.storage.local.get(['tasks'], function (result) {
            allTasks = result.tasks;
            currentTaskInfo(allTasks)
        })
    }
    listTasks();

    /**
    * list tasks when extension opened
    * @function listTasks
    * @memberof popupjs
    */
    function currentTaskInfo(currentTaskInf) {
        $('.js-previousTasks').empty();
        var now = new Date().getTime();
        var oldTaskHTML = '';
    
        if(currentTaskInf != undefined) {
        var currentID = currentTaskInf.current.id -1;
            if (currentTaskInf.current.anyCurrent) {
                timer = now - currentTaskInf.current.date;
                if(currentTaskInf.current.totalSpended > 0) {
                    timer += currentTaskInf.current.totalSpended;
                }
                timer = millisToMinutesAndSeconds(timer);
                timer = timer.split(':')
                if(parseInt(timer[0]) > 0) {
                    if(parseInt(timer[0]) < 10 ){
                        timer[0] = timer[0].toString().substring(1);
                    }
                    $('.js-currentTask-time-hour').text(timer[0] +' Hour(s) and');
                }
                $('.js-currentTask-time-min').text(timer[1] + ' minute(s)');
                $('.js-currentTask-name').text(currentTaskInf.current.name);
                $('.js-has-working-task').removeClass('hidden');
                $('.js-no-working-task').addClass('hidden');
            } else{
                $('.js-has-working-task').addClass('hidden');
                $('.js-no-working-task').removeClass('hidden');
            }
            for (var i = 0; i < currentTaskInf.oldTasks.length; i++) {
                if((!(currentTaskInf.current.anyCurrent && currentID == i)) && !currentTaskInf.oldTasks[i].removed){
                    timer = millisToMinutesAndSeconds(currentTaskInf.oldTasks[i].totalSpended);
                    oldTaskHTML += '<div class="inactiveTask" data-id="' + currentTaskInf.oldTasks[i].id + '"> <span class="inactiveTaskName">';
                    oldTaskHTML += currentTaskInf.oldTasks[i].name + ' - </span> <span class="inactiveTaskDate">';
                    oldTaskHTML += timer + '</span> <span class="launchTask js-launchTask"> <img src="../assets/icons/launch.png" title="Start working on this task"> </span>';
                    oldTaskHTML += '<span class="removeOldTask js-removeOldTask" data-id="' + currentTaskInf.oldTasks[i].id + '">  <img src="../assets/icons/remove.png" title="Remove this task">  </span>';
                    oldTaskHTML += '</div>';
                }
            }
            
        $('.js-previousTasks').append(oldTaskHTML);
        }
    }


    function millisToMinutesAndSeconds(millis) {
        var minutes = Math.floor((millis / (1000 * 60)) % 60);
        var hrs = Math.floor(millis / (1000 * 60 * 60)).toFixed(0);
        return (hrs < 10 ? '0' : '') + hrs + ":" + (minutes < 10 ? '0' : '') + minutes;
    }

    /**
     * list tasks when extension opened
     * @function startOldTaskAgain
     * @memberof popupjs
     */
    function startOldTaskAgain() {
        $(document).on("click",".js-launchTask",function() {
            var taskId = $(this).parent().data('id');
            chrome.storage.local.get(['tasks'], function (result) {
                allTasks = result.tasks;
                taskId -= 1;
                moveToOld(allTasks, taskId)
                movetoCurrent(allTasks, taskId)
                sendBadge();
            })
            checkTasks();
        })
    }
    startOldTaskAgain();

    /**
     * list tasks when extension opened
     * @function finishCurrentTask
     * @memberof popupjs
     */
    function finishCurrentTask() {
        $(document).on("click",".js-currentTaskMission",function() {
            chrome.storage.local.get(['tasks'], function (result) {
                moveToOld(result.tasks, result.tasks.current.id)
                sendBadge();
                checkTasks();
            })
        })
    }
    finishCurrentTask();

     /**
     * move old task to current
     * @function movetoCurrent
     * @memberof popupjs
     */
    function movetoCurrent(allTasks,moveId) {
        var now = new Date().getTime();
        allTasks.current.anyCurrent = true;
        allTasks.current.id = allTasks.oldTasks[moveId].id;
        allTasks.current.name = allTasks.oldTasks[moveId].name;
        allTasks.current.date = now;
        allTasks.current.totalSpended = allTasks.oldTasks[moveId].totalSpended;
        chrome.storage.local.set({ 'tasks': allTasks }, function(){
            listTasks();
        });
    }


    /**
     * move task to old task
     * @function moveToOld
     * @memberof popupjs
     */
    function moveToOld(alltasks, moveId) {
        var now = new Date().getTime();
        if(alltasks.current.anyCurrent){
            
            if(alltasks.current.id == alltasks.lastTaskId && alltasks.oldTasks.findIndex(x => x.id === (moveId)) < 0)  {
                var moveToOld = {
                    id: alltasks.current.id,
                    name: alltasks.current.name,
                    date: alltasks.current.date,
                    totalSpended: now - alltasks.current.date,
                    removed: false
                }
                alltasks.oldTasks.push(moveToOld);
            }else  {
                var stime = now - alltasks.current.date;
                alltasks.oldTasks[moveId-1].totalSpended += stime;
            }  

            alltasks.current.anyCurrent = false;
            chrome.storage.local.set({ 'tasks': alltasks }, function(){
                listTasks();
            });
        }
    }


    window.setInterval(function(){
        listTasks();
    }, 60000 )


    function setBadge(result) {
        if(result.tasks != undefined) {
          var now = new Date().getTime();
          timePass = (now - result.tasks.current.date) + result.tasks.current.totalSpended;
          var minutes = Math.floor((timePass / (1000 * 60)) % 60);
          var hrs = Math.floor(timePass / (1000 * 60 * 60)).toFixed(0);
          if(minutes < 10) {minutes = '0'+minutes;}
          if (result.tasks.current.anyCurrent) {
            chrome.browserAction.setBadgeText({"text": hrs +':'+minutes})
          } else {
            chrome.browserAction.setBadgeText({"text":"" })
          }
        }
      }
      
      
      function sendBadge(){
        chrome.storage.local.get(['tasks'], function(result) {
            if(result.tasks != undefined){
                setBadge(result);
              }
        }); 
      }
      sendBadge();
      
    /**
     * move old task to current
     * @function resetSprint
     * @memberof popupjs
     */
    function resetSprint() {
        $('.js-resetSprint').click(function(){
            $('.js-resetSprint').addClass('hidden');
            $('.js-exportSprint').addClass('hidden');
            $('.resetConfirmation').removeClass('hidden');
            setTimeout(function(){
                resetFooter(false);
            }, 3000);
        })

        $('.js-resetConfirmation').click(function(){
            var tasks = {
                current: {
                    anyCurrent: false
                },
                oldTasks: [],
                lastTaskId: 0
            }
            chrome.storage.local.set({ 'tasks': tasks }, function () {
                checkTasks();
                resetFooter(true);
            });
        })

        $('.js-cancelReset').click(function() {
            resetFooter(false);
        })
    }
    resetSprint();



    /**
     * reset footer view
     * @function resetFooter
     * @memberof popupjs
     */
    function resetFooter(showfooter) {
        $('.js-resetSprint').removeClass('hidden');
        $('.js-exportSprint').removeClass('hidden');
        $('.resetConfirmation').addClass('hidden');
        if(showfooter){
            $('.js-footer').addClass('hidden');
        }
    }



     /**
     * export tasks as csv
     * @function exportTasks
     * @memberof popupjs
     */
    function exportTasks() {
        $('.js-exportSprint').click(function() {
            var now = new Date().getTime();
            var tasksArray = [['Task Name','Task Time(hr:min)'],]
            chrome.storage.local.get(['tasks'], function (result) {
                if(result.tasks.current.anyCurrent){
                    timer = now - result.tasks.current.date;
                    timer = millisToMinutesAndSeconds(timer);
                    var crnt = [result.tasks.current.name,timer]
                    tasksArray.push(crnt)
                }

                for (var i = 0; i < result.tasks.oldTasks.length; i++) {
                   crnttime = millisToMinutesAndSeconds(result.tasks.oldTasks[i].totalSpended);
                   var tsk = [result.tasks.oldTasks[i].name,crnttime]
                   tasksArray.push(tsk)
                }
                exportToCsv('sprint-tasks.csv', tasksArray)
            })
        })
        
    }
    exportTasks();


    function exportToCsv(filename, rows) {
        var processRow = function (row) {
            var finalVal = '';
            for (var j = 0; j < row.length; j++) {
                var innerValue = row[j] === null ? '' : row[j].toString();
                if (row[j] instanceof Date) {
                    innerValue = row[j].toLocaleString();
                };
                var result = innerValue.replace(/"/g, '""');
                if (result.search(/("|,|\n)/g) >= 0)
                    result = '"' + result + '"';
                if (j > 0)
                    finalVal += ',';
                finalVal += result;
            }
            return finalVal + '\n';
        };

        var csvFile = '';
        for (var i = 0; i < rows.length; i++) {
            csvFile += processRow(rows[i]);
        }

        var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
        var link = document.createElement("a");
            if (link.download !== undefined) { 
                var url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
    }

    /**
     * remove task from list
     * @function removeTask
     * @memberof popupjs
     */
    function removeTask() {
        $(document).on("click",".js-removeOldTask",function() {
            var ind = $(this).data('id');
            chrome.storage.local.get(['tasks'], function (result) {
                var removedTasks = result.tasks
                var removeIndex = removedTasks.oldTasks.findIndex(x => x.id === (ind))
                
                removedTasks.oldTasks[removeIndex].removed = true;

                chrome.storage.local.set({ 'tasks': removedTasks }, function () {
                   
                });
            })
            listTasks();
        })
    }
    removeTask();
})

