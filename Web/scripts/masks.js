function numberMask(ie, ff) {
	var key;
    if (ie) {
        key = ie;
    } else {
        key = ff;
    } 
    /**
    * 13 = [ENTER]
    * 8  = [BackSpace]
    * 9  = [TAB]
    * 46 = [Delete]
    * 48 a 57 = São os números
    */
    if ((key >= 48 && key <= 57) || (key == 8) || (key == 13) || (key == 9) || (key == 46)) {
        return true;
    }
    else {
        return false;
    }
}
