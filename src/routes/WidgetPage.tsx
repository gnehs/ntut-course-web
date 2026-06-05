import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Clipboard, PlaySquare } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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

export function WidgetPage() {
	const { dataset, getCourses, getMyCourseIds } = useApp();
	const [courses, setCourses] = useState<WidgetCourse[] | null>(null);
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
		<div className='flex flex-col gap-5'>
			<section className='flex flex-col gap-4'>
				<h1 className='text-3xl font-semibold tracking-normal'>iOS 小工具</h1>
				<p className='max-w-2xl text-[rgb(var(--vs-text))]/75'>
					複製下方 Scriptable 程式碼，貼到 iPhone 後就能在桌面查看下一堂課。
				</p>
			</section>
			{!courses.length ? (
				<Alert variant='destructive'>
					<AlertCircle />
					<AlertTitle>沒有課程資料</AlertTitle>
					<AlertDescription>請先新增課程資料，產生的小工具才會有課表內容。</AlertDescription>
				</Alert>
			) : null}
			<Card className='overflow-hidden rounded-lg border border-[rgba(var(--vs-text),0.1)] bg-[rgb(var(--vs-background))] shadow-sm'>
				<CardHeader className='gap-3 border-b border-[rgba(var(--vs-text),0.08)] p-4 sm:flex sm:flex-row sm:items-center sm:justify-between sm:px-5'>
					<div className='min-w-0'>
						<CardTitle className='text-base font-semibold'>1. 複製 Scriptable 程式碼</CardTitle>
						<CardDescription>
							包含 {courses.length} 門課程資料，課表變更後請重新複製。
						</CardDescription>
					</div>
					<Button
						active
						size='sm'
						onClick={async () => {
							try {
								await copyCode(code);
								toast.success('已複製', {
									description: '請到 Scriptable 貼上程式碼即可使用小工具',
								});
							} catch {
								toast.error('複製失敗', {
									description: '請嘗試手動複製',
								});
							}
						}}
					>
						<Clipboard className='size-4' data-icon='inline-start' />
						複製
					</Button>
				</CardHeader>
				<CardContent className='p-0'>
					<pre
						id='scriptable-code'
						className='h-[512px] overflow-auto bg-[rgb(var(--vs-gray-1))] p-4 text-sm leading-6 whitespace-pre-wrap'
					>
						{code}
					</pre>
				</CardContent>
			</Card>
			<Card className='rounded-lg border border-[rgba(var(--vs-text),0.1)] bg-[rgb(var(--vs-background))] shadow-sm'>
				<CardHeader className='p-4 sm:px-5'>
					<CardTitle className='text-base font-semibold'>2. 貼到 Scriptable 並加入小工具</CardTitle>
					<CardDescription>
						先安裝 Scriptable，建立 Script 後貼上程式碼，再依照影片加入桌面小工具。
						<br />* 課表變更後重新貼上程式碼
					</CardDescription>
				</CardHeader>
				<CardContent className='flex flex-col gap-4 p-4 pt-0 sm:px-5'>
					<div className='flex flex-wrap gap-2'>
						<Button
							as='a'
							href='https://apps.apple.com/tw/app/scriptable/id1405459188'
							target='_blank'
							rel='noreferrer'
						>
							開啟 App Store
						</Button>
					</div>
					<Separator className='bg-[rgba(var(--vs-text),0.08)]' />
					<div className='flex items-center gap-2 text-sm font-medium'>
						<PlaySquare className='size-4' />
						教學影片
					</div>
					<video loop controls className='mx-auto block max-h-[640px] max-w-full rounded-lg'>
						<source src='/video/how_to_add_iOS_widget.mp4' type='video/mp4' />
					</video>
				</CardContent>
			</Card>
		</div>
	);
}

async function copyCode(code: string) {
	try {
		window.gtag?.('event', 'copy_ios_widget_code');
	} catch {}
	await navigator.clipboard.writeText(code);
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
