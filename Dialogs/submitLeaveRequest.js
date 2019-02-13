const submitLeaveRecordCard = require('../Cards/submitLeaveRecordCard.json');
const { holidays } = require('../holidayOperations/holidays');


class submitLeaveRequest {
    constructor(){
        this.holFunction = new holidays();
    }
    async getLeaveRecordData(startDate,endDate,reason){
        var returnListOfData = [];
        var dataFormat={};
        var listOfAllHolidays = this.holFunction.getAllHolidays();
        while(startDate<=endDate){
            var flag = 0;
            listOfAllHolidays.forEach((i)=>{
                if(i==startDate){
                    flag+=1;
                }
            });
            if(startDate.toString().substr(0,3)=='Sat'||
                startDate.toString().substr(0,3)=='Sun'||
                flag != 0){}
            else{
                dataFormat.date = startDate.toString().substr(0,15);
                dataFormat.reason = reason;
                returnListOfData.push(dataFormat);
                dataFormat = {};
            }

            startDate.setDate(startDate.getDate() + 1);
        }
        return returnListOfData;
    }
    async getSubmitLeaveRecord(){
        return submitLeaveRecordCard;
    }
}
module.exports.submitLeaveRequest = submitLeaveRequest;
