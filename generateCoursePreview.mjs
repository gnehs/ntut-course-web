import axios from "axios";
import fs from "fs";
import { JSDOM } from "jsdom";



let now = new Date()

let indexHTML = fs.readFileSync('./dist/200.html')
let dom = await JSDOM.fromFile('./dist/200.html')
let document = dom.window.document

let yearSems = await axios.get('https://gnehs.github.io/ntut-course-crawler-node/main.json')
let tasks = Object.entries(yearSems.data)
  .map((([year, sems]) => sems.map(sem => ({ year, sem }))))
  .flat()
  .slice(-6)
  .map(async ({ year, sem }) => {
    let courses = await axios.get(`https://gnehs.github.io/ntut-course-crawler-node/${year}/${sem}/main.json`)
    console.log(`Generate routes: ${year}/${sem} ${courses.data.length}`)
    fs.mkdirSync(`./dist/course/${year}/${sem}/`, { recursive: true })

    courses.data.map(course => {

      let courseNumber = [`𝟬`, `𝟭`, `𝟮`, `𝟯`, `𝟰`, `𝟱`, `𝟲`, `𝟳`, `𝟴`, `𝟵`]
      let parsedCourseId = course.id.split('').map((c) => courseNumber[c]).join('')
      let title = `${parsedCourseId} ${course.name.zh}`
      let description = `${course.description.zh}`
      let image = `https://ntut-course-og.gnehs.net/api?year=${year}&sem=${sem}&id=${course.id}`


      function setMeta(name, content) {
        let meta
        meta = document.querySelector(`meta[name="${name}"]`)
        if (!meta) {
          meta = document.createElement('meta')
          meta.setAttribute('name', name)
          document.head.appendChild(meta)
        }
        meta.setAttribute('content', content)
      }
      setMeta('og:title', title)
      setMeta('og:description', description)
      setMeta('og:url', `https://ntut-course.gnehs.net/course/${year}/${sem}/${course.id}`)
      setMeta('og:image', image)
      setMeta('description', description)
      setMeta('twitter:title', title)
      setMeta('twitter:description', description)
      setMeta('twitter:image', image)
      setMeta('twitter:card', 'summary_large_image')
      document.querySelector('title').textContent = title

      fs.writeFileSync(`./dist/course/${year}/${sem}/${course.id}.html`, dom.serialize().replace(/&amp;/g, '&'))
    })
  })
await Promise.all(tasks)
console.log(`Generate routes: ${((new Date() - now) / 1000).toFixed(2)}s`)