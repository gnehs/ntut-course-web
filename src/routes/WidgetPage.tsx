import { useEffect, useMemo, useState } from 'react';
import { Alert } from '../components/ui-kit/Alert';
import { Button } from '../components/ui-kit/Button';
import { StepsPageSkeleton } from '../components/ui-kit/PageSkeletons';
import { trimEllip } from '../lib/courseUtils';
import { useApp } from '../state/AppContext';
import type { CourseTime } from '../types/course';

type WidgetCourse = {
	name: string;
	time: CourseTime | undefined;
	classroom: string;
	link: string;
};

type CopyState = {
	title: string;
	text: string;
};

export function WidgetPage() {
	const { dataset, getCourses, getMyCourseIds } = useApp();
	const [courses, setCourses] = useState<WidgetCourse[] | null>(null);
	const [copyState, setCopyState] = useState<CopyState | null>(null);
	useEffect(() => {
		let cancelled = false;
		async function load() {
			const ids = getMyCourseIds();
			const all = await getCourses();
			if (!cancelled) {
				setCourses(
					all
						.filter((course) => ids.includes(course.id))
						.map((course) => ({
							name: course.name?.zh || '',
							time: course.time,
							classroom: trimEllip(
								(course.classroom || []).map((item) => item.name).join('、'),
								13,
							),
							link: `https://ntut-course.gnehs.net/course/${dataset.year}/${dataset.sem}/${course.id}`,
						})),
				);
			}
		}
		load().catch(() => setCourses([]));
		return () => {
			cancelled = true;
		};
	}, [dataset.year, dataset.sem, dataset.department]);
	const code = useMemo(() => createScriptableCode(courses || []), [courses]);
	if (!courses) return <StepsPageSkeleton codeBlock />;
	return (
		<div>
			<h1>iOS 小工具</h1>
			<p>新增小工具在你的桌面上，隨時檢視接下來的課程！</p>
			<p>注意：如果你變更了課程，需要重新複製程式碼才能讓小工具使用最新的課程資料！</p>
			{!courses.length ? (
				<Alert danger>
					<strong>沒有課程資料</strong>
					<br />
					請先新增課程資料
				</Alert>
			) : null}
			<h2>
				<span style={{ color: 'rgb(var(--vs-primary))' }}>Step 0</span> 加入課程
			</h2>
			<p>
				請先將你本學期的課程新增到 <strong>北科課程好朋友</strong>
			</p>
			<h2>
				<span style={{ color: 'rgb(var(--vs-primary))' }}>Step 1</span> 安裝 Scriptable
			</h2>
			<p>
				到 App Store 安裝{' '}
				<a
					href='https://apps.apple.com/tw/app/scriptable/id1405459188'
					target='_blank'
					rel='noreferrer'
				>
					Scriptable
				</a>
			</p>
			<h2>
				<span style={{ color: 'rgb(var(--vs-primary))' }}>Step 2</span> 複製並貼上程式碼
			</h2>
			<p>建立一個 Script 並貼上以下程式碼</p>
			<div className='relative rounded-[8px] border border-[rgba(var(--vs-text),0.1)] bg-[rgb(var(--vs-background))] p-3'>
				<div className='absolute top-2 right-2'>
					<Button
						className='m-0'
						onClick={async () => {
							const result = await copyCode(code);
							setCopyState(result);
						}}
					>
						<i className='bx bx-clipboard' />
						複製
					</Button>
				</div>
				<pre id='scriptable-code' className='h-[512px] overflow-auto whitespace-pre-wrap'>
					{code}
				</pre>
			</div>
			{copyState ? (
				<Alert className='mt-3'>
					<strong>{copyState.title}</strong>
					<br />
					{copyState.text}
				</Alert>
			) : null}
			<h2>
				<span style={{ color: 'rgb(var(--vs-primary))' }}>Step 3</span> 新增小工具到桌面
			</h2>
			<p>參考此影片建立你的小工具</p>
			<video
				loop
				controls
				autoPlay
				className='mx-auto block h-[700px] max-w-full rounded-[16px] shadow-[0_0_16px_rgba(0,0,0,0.05)]'
			>
				<source src='/video/how_to_add_iOS_widget.mp4' type='video/mp4' />
			</video>
		</div>
	);
}

async function copyCode(code: string): Promise<CopyState> {
	try {
		window.gtag?.('event', 'copy_ios_widget_code');
	} catch {}
	try {
		await navigator.clipboard.writeText(code);
		return { title: '已複製', text: '請到 Scriptable 貼上程式碼即可使用小工具' };
	} catch {
		return { title: '複製失敗', text: '請嘗試手動複製' };
	}
}

function createScriptableCode(courseData: WidgetCourse[]) {
	return `const courseData = ${JSON.stringify(courseData)}
function getUpcomingCourse() {
    let currentDate = new Date()
    let timetable = {
        '1': '8:10',
        '2': '9:10',
        '3': '10:10',
        '4': '11:10',
        N: '12:10',
        '5': '13:10',
        '6': '14:10',
        '7': '15:10',
        '8': '16:10',
        '9': '17:10',
        A: '18:30',
        B: '19:20',
        C: '20:20',
        D: '21:10'
    }
    let dateEng2zh = { sun: '週日', mon: '週一', tue: '週二', wed: '週三', thu: '週四', fri: '週五', sat: '週六' }
    let upcomingCourseIncludes = Object.entries(timetable)
        .filter(([courseId, courseTime]) => {
            let tempDate = new Date()
            tempDate.setHours(courseTime.split(':')[0], courseTime.split(':')[1], 0)
            return tempDate > currentDate
        })
        .map(x => x[0])
    let todayDayOfWeek = Object.keys(dateEng2zh)[currentDate.getDay()]
    return courseData
        .filter(x => x.time[todayDayOfWeek].some(r => upcomingCourseIncludes.includes(r))).map(x => ({
            ...x,
            start: timetable[x.time[todayDayOfWeek][0]],
            length: x.time[todayDayOfWeek].length,
        }))
        .sort((a, b) => a.time[todayDayOfWeek][0] - b.time[todayDayOfWeek][0])
}
function createWidget() {
    let gradient = new LinearGradient()
    gradient.locations = [0, 1]
    gradient.colors = [
        new Color("292929"),
        new Color("141414")
    ]

    let widget = new ListWidget()
    widget.backgroundGradient = gradient

    let titleTxt = widget.addText('接下來的課程')
    titleTxt.textColor = Color.white()
    titleTxt.textOpacity = 0.7
    titleTxt.font = Font.mediumSystemFont(13)

    widget.addSpacer(7)
    let upcomingCourse = getUpcomingCourse()
    if (upcomingCourse.length) {
        let course = upcomingCourse[0]
        let courseTxt = widget.addText(course.name)
        courseTxt.textColor = Color.white()
        courseTxt.font = Font.boldSystemFont(16)

        widget.addSpacer(2)
        if (course.classroom != '') {
            let classTxt = widget.addText(course.classroom)
            classTxt.textColor = Color.white()
            classTxt.font = Font.systemFont(13)
        }
        let summaryTxt = widget.addText(\`於 \${course.start} 開始，共 \${course.length} 節\`)
        summaryTxt.textColor = Color.white()
        summaryTxt.font = Font.systemFont(13)
        if (config.runsWithSiri) {
            Speech.speak(\` 你在 \${course.start} 有一堂 \${course.name}\`)
        } else {
            widget.addSpacer()
            let linkSymbol = SFSymbol.named("arrow.up.forward.square")
            let footerStack = widget.addStack()
            let linkStack = footerStack.addStack()
            linkStack.centerAlignContent()
            linkStack.url = course.link
            let linkElement = linkStack.addText("詳細資料")
            linkElement.font = Font.mediumSystemFont(13)
            linkElement.textColor = Color.blue()
            linkStack.addSpacer(3)
            let linkSymbolElement = linkStack.addImage(linkSymbol.image)
            linkSymbolElement.imageSize = new Size(13, 13)
            linkSymbolElement.tintColor = Color.blue()
            footerStack.addSpacer()
            let iconElement = footerStack.addText("🍤")
            iconElement.textOpacity = 0.5
            iconElement.font = Font.mediumSystemFont(13)
            iconElement.url = \`http://ntut-course.gnehs.net/\`
        }
    } else {
        let courseTxt = widget.addText('沒有課程')
        courseTxt.textColor = Color.white()
        courseTxt.font = Font.boldSystemFont(18)
        if (config.runsWithSiri) {
            Speech.speak(\` 好棒，你今天沒課了\`)
        }
    }
    if (config.runsWithSiri || !upcomingCourse.length) {
        widget.addSpacer()
        let footerStack = widget.addStack()
        let providerText = footerStack.addText("🍤 北科課程好朋友")
        providerText.textColor = Color.white()
        providerText.textOpacity = 0.7
        providerText.font = Font.mediumSystemFont(13)
        footerStack.url = \`http://ntut-course.gnehs.net/\`
    }
    return widget
}

let widget = createWidget()
if (config.runsInWidget) {
    Script.setWidget(widget)
} else {
    widget.presentMedium()
}
Script.complete()
`;
}
