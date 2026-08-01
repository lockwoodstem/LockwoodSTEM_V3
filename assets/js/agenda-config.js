// LockwoodSTEM agenda configuration
// Replace these URLs with your own Google Sheets CSV publish links when you are ready.
// In Google Sheets: File > Share > Publish to web > select the tab > CSV.
// Recommended tab names now match the course names used on the site: IED, POE, ADM, and Quotes.
window.LOCKWOOD_AGENDA_CONFIG = {
  csvUrls: {
    IED: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS4L3J5287xZ94Awc47kSrjAKOUIenbvYYlt15zdUAM4oL7Z_nVNegZ8M84JiKfrCr2x4FATCDS81Ng/pub?gid=1181780759&single=true&output=csv",
    POE: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS4L3J5287xZ94Awc47kSrjAKOUIenbvYYlt15zdUAM4oL7Z_nVNegZ8M84JiKfrCr2x4FATCDS81Ng/pub?gid=94192821&single=true&output=csv",
    ADM: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS4L3J5287xZ94Awc47kSrjAKOUIenbvYYlt15zdUAM4oL7Z_nVNegZ8M84JiKfrCr2x4FATCDS81Ng/pub?gid=646728293&single=true&output=csv"
  },
  dueDatesCsvUrl: "https://docs.google.com/spreadsheets/d/13bF4m4GAGQMU1DJKQc_AQcor2i6OLFgPR5bdo0VNT9U/gviz/tq?tqx=out:csv&gid=1747059949",
  quotesCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS4L3J5287xZ94Awc47kSrjAKOUIenbvYYlt15zdUAM4oL7Z_nVNegZ8M84JiKfrCr2x4FATCDS81Ng/pub?gid=1284674718&single=true&output=csv",
  defaultCourse: "IED",
  courseLabels: {
    IED: "IED",
    POE: "POE",
    ADM: "ADM"
  },
  legacyCourseAliases: {
    IED: ["IED"],
    POE: [],
    ADM: ["AM"]
  }
};
