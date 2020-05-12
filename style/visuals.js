// using d3 for convenience
//$("#observablehq-1fcfa6dd").hide();
var main = d3.select("main");
var scrolly = main.select("#scrolly");
var figure = scrolly.select("figure");
var article = scrolly.select("article");
var step = article.selectAll(".step");

// initialize the scrollama
var scroller = scrollama();

var graphic_ids = [
  //"#observablehq-1fcfa6dd",
  "#observablehq-ba4ac1f1",
  "#observablehq-a7af9556",
  //"#observablehq-f11c2dc2",
  //"#observablehq-78b8a1de",
  //"#observablehq-84c3fa4d",
  //"#observablehq-f9359434",
  //"#observablehq-6f6628ea",
  //"#observablehq-e5fbb79e"
];

function showOnly(id_to_show) {
  for (id in graphic_ids) {
    if (id == id_to_show) {
      $(id).show();
    } else {
      $(id).hide();
    }
  }
}

showOnly("#observablehq-ba4ac1f1");

// generic window resize listener event
function handleResize() {
  // 1. update height of step elements
  var stepH = Math.floor(window.innerHeight * 0.75);
  step.style("height", stepH + "px");

  var figureHeight = window.innerHeight / 2;
  var figureMarginTop = (window.innerHeight - figureHeight) / 2;

  figure
    .style("height", figureHeight + "px")
    .style("top", figureMarginTop + "px");

  // 3. tell scrollama to update new element dimensions
  scroller.resize();
}

// scrollama event handlers
function handleStepEnter(response) {
  console.log(response);
  // response = { element, direction, index }

  // add color to current step only
  step.classed("is-active", function(d, i) {
    return i === response.index;
  });

  // update graphic based on step
  showOnly(graphic_ids[response.index])
}

function setupStickyfill() {
  d3.selectAll(".sticky").each(function() {
    Stickyfill.add(this);
  });
}

function init() {
  setupStickyfill();

  // 1. force a resize on load to ensure proper dimensions are sent to scrollama
  handleResize();

  // 2. setup the scroller passing options
  // 		this will also initialize trigger observations
  // 3. bind scrollama event handlers (this can be chained like below)
  scroller
    .setup({
      step: "#scrolly article .step",
      offset: 0.33,
      debug: true
    })
    .onStepEnter(handleStepEnter);

  // setup resize event
  window.addEventListener("resize", handleResize);
}

// kick things off
init();

