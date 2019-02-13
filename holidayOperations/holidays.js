var listOfHolidays = require('../storedInformation/holidays.json');

class holidays{
    getHolidaysByTypeAndStartEndDate(type,startDate,endDate){
        var returnList = [];
        listOfHolidays.holidays.forEach((i)=>{
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
            if(dateOfHoliday <= endDate && dateOfHoliday >= startDate && i.type == type){
                returnList.push(i);
            }
        });
        return returnList;
    }
    getAllHolidays(){
        var returnList = [];
        listOfHolidays.holidays.forEach((i)=>{
            if(i.month!='To Be Decided'){
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
                returnList.push(dateOfHoliday.toString().substr(0,15));
            }
        });
        return returnList;
    }
}

module.exports.holidays = holidays;
