const courseData = [];

function getUpcomingCourse() {
	let currentDate = new Date();
	let timetable = {
		1: '8:10',
		2: '9:10',
		3: '10:10',
		4: '11:10',
		N: '12:10',
		5: '13:10',
		6: '14:10',
		7: '15:10',
		8: '16:10',
		9: '17:10',
		A: '18:30',
		B: '19:20',
		C: '20:20',
		D: '21:10',
	};
	let dateEng2zh = {
		sun: '週日',
		mon: '週一',
		tue: '週二',
		wed: '週三',
		thu: '週四',
		fri: '週五',
		sat: '週六',
	};
	// show upcoming course
	let upcomingCourseIncludes = Object.entries(timetable)
		.filter(([courseId, courseTime]) => {
			let tempDate = new Date();
			tempDate.setHours(courseTime.split(':')[0], courseTime.split(':')[1], 0);
			return tempDate > currentDate;
		})
		.map((x) => x[0]);
	let todayDayOfWeek = Object.keys(dateEng2zh)[currentDate.getDay()];
	return courseData
		.filter((x) => x.time[todayDayOfWeek].some((r) => upcomingCourseIncludes.includes(r)))
		.map((x) => ({
			...x,
			start: timetable[x.time[todayDayOfWeek][0]],
			length: x.time[todayDayOfWeek].length,
		}))
		.sort((a, b) => a.time[todayDayOfWeek][0] - b.time[todayDayOfWeek][0]);
}
function createWidget() {
	let gradient = new LinearGradient();
	gradient.locations = [0, 1];
	gradient.colors = [new Color('292929'), new Color('141414')];

	let widget = new ListWidget();
	widget.backgroundGradient = gradient;

	let titleTxt = widget.addText('接下來的課程');
	titleTxt.textColor = Color.white();
	titleTxt.textOpacity = 0.7;
	titleTxt.font = Font.mediumSystemFont(13);

	widget.addSpacer(7);
	let upcomingCourse = getUpcomingCourse();
	if (upcomingCourse.length) {
		let course = upcomingCourse[0];
		let courseTxt = widget.addText(course.name);
		courseTxt.textColor = Color.white();
		courseTxt.font = Font.boldSystemFont(16);

		widget.addSpacer(2);
		if (course.classroom != '') {
			let classTxt = widget.addText(course.classroom);
			classTxt.textColor = Color.white();
			classTxt.font = Font.systemFont(13);
		}
		let summaryTxt = widget.addText(`於 ${course.start} 開始，共 ${course.length} 節`);
		summaryTxt.textColor = Color.white();
		summaryTxt.font = Font.systemFont(13);
		if (config.runsWithSiri) {
			Speech.speak(` 你在 ${course.start} 有一堂 ${course.name}`);
		} else {
			widget.addSpacer();
			// Add button to open course detail
			let linkSymbol = SFSymbol.named('arrow.up.forward.square');
			let footerStack = widget.addStack();
			let linkStack = footerStack.addStack();
			linkStack.centerAlignContent();
			linkStack.url = course.link;
			let linkElement = linkStack.addText('詳細資料');
			linkElement.font = Font.mediumSystemFont(13);
			linkElement.textColor = Color.blue();
			linkStack.addSpacer(3);
			let linkSymbolElement = linkStack.addImage(linkSymbol.image);
			linkSymbolElement.imageSize = new Size(13, 13);
			linkSymbolElement.tintColor = Color.blue();
			footerStack.addSpacer();
			// Add link to open course detail
			let iconElement = footerStack.addText('🍤');
			iconElement.textOpacity = 0.5;
			iconElement.font = Font.mediumSystemFont(13);
			iconElement.url = `http://ntut-course.gnehs.net/`;
		}
	} else {
		let courseTxt = widget.addText('沒有課程');
		courseTxt.textColor = Color.white();
		courseTxt.font = Font.boldSystemFont(18);
		if (config.runsWithSiri) {
			Speech.speak(` 好棒，你今天沒課了`);
		}
	}
	// add footer
	if (config.runsWithSiri || !upcomingCourse.length) {
		widget.addSpacer();
		let footerStack = widget.addStack();
		let providerText = footerStack.addText('🍤 北科課程好朋友');
		providerText.textColor = Color.white();
		providerText.textOpacity = 0.7;
		providerText.font = Font.mediumSystemFont(13);
		footerStack.url = `http://ntut-course.gnehs.net/`;
	}
	return widget;
}

let widget = createWidget();
if (config.runsInWidget) {
	Script.setWidget(widget);
} else {
	widget.presentMedium();
}
Script.complete();
