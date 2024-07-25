function renderFeed(apiQuestions, container) {
  for (var i = 0; i < apiQuestions.length; i++) {
    var apiQuestion = apiQuestions[i];
    var div = document.createElement("div");
    div.className = "soQuestion";
    var html = "<h2><img class='soAvatar' title='" + apiQuestion.owner.display_name + "' src='" + apiQuestion.owner.profile_image + "'> ";
    html += "<a target='_blank' href='" + apiQuestion.link + "'>" + apiQuestion.title + "</a></h2>";
    html += "<p>" + apiQuestion.body + "</p>";
    html += "<div>";
    if (apiQuestion.accepted_answer_id) {
      html += "<span class='soAnswered' title='This question has an accepted answer'>Answers: " + apiQuestion.answer_count + "</span>"
    } else {
      html += "<span class='soStats'>Answers: " + apiQuestion.answer_count + "</span>"
    }
    for (var j = 0; j < apiQuestion.tags.length; j++) {
      var tag = apiQuestion.tags[j];
      html += "<span class='soTag'>" + tag + "</span>"
    }
    html += "</div>";
    div.innerHTML = html;
    container.appendChild(div);
  }
  // syntax highlighting
  var codeBlocks = document.getElementsByTagName('pre');
  for (var k = 0; k < codeBlocks.length; k++) {
    codeBlocks[k].className += ' prettyprint';
  }
  PR.prettyPrint();
}

function loadFeed(tags) {
  document.getElementById('soSettings').hidden = true;
  document.getElementById('soFeed').hidden = false;
  var container = document.getElementById("soFeed");
  container.innerHTML = "<div class='soLoader'>Loading question digest...</div>";
  var xhr = new XMLHttpRequest();
  xhr.open('GET', "https://api.stackexchange.com/2.2/questions?order=desc&sort=activity&tagged=" + encodeURIComponent(tags.split(" ").join(";")) + "&site=stackoverflow&filter=!gB56kCX)5zmmIj1A5scTu*7eVQAUCyMJw6p", true);
  xhr.responseType = 'json';
  xhr.onload = function () {
    var status = xhr.status;
    if (status === 200) {
      if (xhr.response.items === undefined || xhr.response.items.length === 0) {
        container.innerHTML = "<div class='soLoader'>No questions found. Try to refine search query in widget settings.</div>";
      } else {
        container.innerHTML = "";
        renderFeed(xhr.response.items, container)
      }
    } else {
      container.innerHTML = "<div class='soLoader'>Failed to load questions from Stack Overflow. Check browser console for errors.</div>";
    }
  };
  xhr.send();
}