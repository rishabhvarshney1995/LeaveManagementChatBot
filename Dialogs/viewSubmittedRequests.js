const { holidays } = require('../holidayOperations/holidays');
const employeeDetailsCard = require('../Cards/employeeLeaveRecordCard.json');

class viewSubmittedRequests{
    constructor(){

    }
    async createEmployeeDetailsCard(userProfile){
        var hol = new holidays();
        var requiredList = hol.getHolidaysByTypeAndStartEndDate('Flexible',new Date('2019-01-01'),new Date('2019-12-31'));

        employeeDetailsCard.body[0].columns[1].items=[];
        employeeDetailsCard.body[0].columns[1].items.push({
            "type": "TextBlock",
            "weight": "Bolder",
            "text": `${userProfile.name}`
        });
        employeeDetailsCard.body[0].columns[1].items.push({
            "type": "TextBlock",
            "weight": "Bolder",
            "text": `Employee Code : ${userProfile.employeeid}`
        });
        employeeDetailsCard.body[1].facts = [];
        employeeDetailsCard.body[1].facts.push({
                "title": "Flexible Leaves Left",
                "value": `${3-userProfile.numberOfFlexibleLeavesTaken}`
            });
        employeeDetailsCard.body[1].facts.push({
                "title": "Normal Leaves Left",
                "value": `${27-userProfile.numberOfLeavesTaken}`
            });

        userProfile.listOfFlexibleHolidays.forEach((j)=>{
            requiredList.forEach((i)=>{
                var mon ='';
                if(i.month<10){
                    mon = '0'+i.month;
                }
                else{
                    mon = i.month;
                }
                var da ='';
                if(i.date<10){
                    da = '0'+i.date;
                }
                else{
                    da = i.date;
                }
                var dateOfHoliday = new Date(i.year+'-'+mon+'-'+da);
                if(dateOfHoliday.toString().substr(0,15) == j){
                    var dataToPush = {
                        "title": j+'     ',
                        "value": i.name
                    };
                    employeeDetailsCard.actions[0].card.body[0].facts.push(dataToPush);
                }
            });
        });
        userProfile.listOfHolidaysTaken.forEach((i)=>{
            var dataToPush = {
                "title": i.date+'     ',
                "value": i.reason
            };
            employeeDetailsCard.actions[1].card.body[0].facts.push(dataToPush);
        });
        return employeeDetailsCard;
    }
}
module.exports.viewSubmittedRequests = viewSubmittedRequests;
