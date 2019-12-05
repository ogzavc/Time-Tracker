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
                $('body').addClass('dark');	
                $('.js-darkMode').prop('checked',true);
           }
        }
    });
    }
    darkModeCheck();

    /**
     * tab selections
     * @function tabSelection
     * @memberof popupjs
     */
    function tabSelection() {
        $('.js-tabLink').click(function(index) {
            var ind = $('.js-tabLink').index(this);
            $('.js-tabContent').each(function() {
                $(this).removeClass('active');
            })

            $('.js-tabLink').each(function(){
                $(this).removeClass('active')
            })
        
            $('.js-tabContent').eq(ind).addClass('active');
            $(this).addClass('active');
        })
    }
    tabSelection();
    $('.js-tabLink').eq(0).trigger('click');


    /**
     * checkbox change dev or test
     * @function checkPosition
     * @memberof optionsJS
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
     * @memberof optionsJS
     */
    var displayedTeamNameDefault = $('.js-displayed-team-name').text();
    function checkTeamName() {
        $('.js-team-name').keyup(function () {
            $('.js-displayed-team-name').text(displayedTeamNameDefault + $(this).val());
        })
    }
    checkTeamName();

    /**
     * set personal informations
     * @function setPersInf
     * @memberof optionsJS
     */
    function setPersInf(){
        chrome.storage.local.get(['personalInfo'], function (result) {

            if(result.personalInfo != undefined) {
                if(result.personalInfo.position == 1){
                    $('.js-position-checkbox').attr('checked',true)
                }
                if(result.personalInfo.teamsName.length > 0){
                    $('.js-team-name').val(result.personalInfo.teamsName);
                    $('.js-displayed-team-name').text('Working on : '+result.personalInfo.teamsName);
                }
                if(result.personalInfo.sprintWeeks > 0){
                    $("input[name=rb][value='"+result.personalInfo.sprintWeeks+"']").prop("checked",true);
                }
            }
           
        }); 
    }
    setPersInf();


    /**
     * dark mode swicher
     * @function darkMode
     * @memberof optionsJS
     */
    function darkMode(){
        $('.js-darkMode').click(function() {
            if ($(this).is(':checked')) {
                $('body').addClass('dark')	
                var opt = {
                    darkMode: 1,
                }
                chrome.storage.local.set({ 'options': opt });
            } else {
                $('body').removeClass('dark');
                var opt = {
                    darkMode: 0,
                }
                chrome.storage.local.set({ 'options': opt });	
            }
        })
    }
    darkMode();



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

            var inf = {
                position: pos,
                teamsName: teamName,
                sprintWeeks: sprintTime
            }
            chrome.storage.local.set({ 'personalInfo': inf });


            $(this).addClass('saved',{duration:500});
            setTimeout(function(){
                $('.js-save-info').removeClass('saved',{duration:500});
            }, 4000);
        })
    }
    saveInfo();


    /**
    * show modal for delete
    * @function deleteModal
    * @memberof popupjs
    */
   function deleteModal() { 
    var modal = document.getElementById("deleteModal");

    $('.js-delete-tasks').click(function(){
        modal.style.display = "block";
    })

    $('.js-cancelReset, .js-closeDelModal').click(function() {
        modal.style.display = "none";
    })
   
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
   }
   deleteModal();

    /**
    * delete confirmation
    * @function confirmDelete
    * @memberof popupjs
    */
   function confirmDelete() {  
    $('.js-resetConfirmation').click(function(){
        var tasks = {
            current: {
                anyCurrent: false
            },
            oldTasks: [],
            lastTaskId: 0
        }
        chrome.storage.local.set({ 'tasks': tasks }, function(){

            $('.js-resetConfirmation, .js-cancelReset').addClass('hidden');
            $('.js-tasksDeleted').removeClass('hidden');

            setTimeout(function(){ 
                var modal = document.getElementById("deleteModal");
                modal.style.display = "none";
                $('.js-resetConfirmation, .js-cancelReset').removeClass('hidden');
                $('.js-tasksDeleted').addClass('hidden');
            }, 2000);
            
        });
    })
   }
   confirmDelete();

   /**
     * export from options
     * @function tasks
     * @memberof optionsJS
     */
    function exportFromOpt(){
        $('.js-export-tasks').click(function() {
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
    exportFromOpt();


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

    function millisToMinutesAndSeconds(millis) {
        var minutes = Math.floor((millis / (1000 * 60)) % 60);
        var hrs = Math.floor(millis / (1000 * 60 * 60)).toFixed(0);
        return (hrs < 10 ? '0' : '') + hrs + ":" + (minutes < 10 ? '0' : '') + minutes;
    }
   
})