import app from './app'

export default function onHttpError (error) {
  const report = error.response.data
  const level = report.level || 'ERROR'
  app.config.globalProperties.$notify({
    type: level.toLowerCase(),
    title: level,
    message: '<p>' + report.error + '</p>' +
      (report.cause ? '<p>Cause: ' + report.cause + '</p>' : ''),
    dangerouslyUseHTMLString: true,
    duration: 0
  })
}
