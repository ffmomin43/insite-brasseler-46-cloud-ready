function updateRMA(rmaList) {
	var currentDate = new Date().getTime();
	var orderDate= new Date($('.od-head').attr("date-attr")).getTime();
	var days = (currentDate - orderDate) / (24 * 60 * 60 * 1000);
	var intDays = Math.floor(Math.abs(days));
	var checkSendRequest = 0;
	
	$.each(rmaList,function(){
	    if ($(this).find(".haz-product").attr("haz-attr") == "true") {
	        $(this).hide();
	    }
	    else if (intDays >= $(this).find(".qty-return").attr("rma-attr")) {
	        $(this).hide();

	    } else {
	        checkSendRequest = checkSendRequest + 1;
	    }
	});
	if (checkSendRequest === 0) {
	    $("#requestRmaViewSendReturnRequestButton").hide();
        $(".return-submit").hide();
	}
}

function setupRMA() {
    var itemReturnList = $('.item-return');
    if (itemReturnList.length > 0) {
        updateRMA(itemReturnList);
    }
    //BUSA-611: RMA - Return Request page gets unresponsive on navigating back and forth through browser.
    //commenting code to avoid infinite while loop.commenting may affect hazardous product hiding.
    //while (itemReturnList.length <= 0) {
    //    itemReturnList = $('.item-return');
    //    if (itemReturnList.length > 0) {
    //        updateRMA(itemReturnList);
    //    }
        
    //}
    
}
