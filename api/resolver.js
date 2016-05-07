var key = require('../utils/key');
var sync = require('synchronize');
var request = require('request');
var _ = require('underscore');

// The API that returns the in-email representation.
module.exports = function(req, res) {
  var url = req.query.url.trim();

  // XKCD urls are in the format:
  // http://xkcd.com/<id>/
  // Requests to the API are made using the following URL pattern
  // http://xkcd.com/<id>/info.0.json
  // And here is an example of the returned JSON object:
  // {  
  //    "month":"10",
  //    "num":327,
  //    "link":"",
  //    "year":"2007",
  //    "news":"",
  //    "safe_title":"Exploits of a Mom",
  //    "transcript":"[[A woman is talking on the phone, holding a cup]]\nPhone: Hi, this is your son's school. We're having some computer trouble.\nMom: Oh dear\u00c3\u00a2\u00c2\u0080\u00c2\u0094did he break something?\nPhone: In a way\u00c3\u00a2\u00c2\u0080\u00c2\u0094\nPhone: Did you really name your son \"Robert'); DROP TABLE Students;--\" ?\nMom: Oh, yes. Little Bobby Tables, we call him.\nPhone: Well, we've lost this year's student records. I hope you're happy.\nMom: And I hope you've learned to sanitize your database inputs.\n{{title-text: Her daughter is named Help I'm trapped in a driver's license factory.}}",
  //    "alt":"Her daughter is named Help I'm trapped in a driver's license factory.",
  //    "img":"http:\/\/imgs.xkcd.com\/comics\/exploits_of_a_mom.png",
  //    "title":"Exploits of a Mom",
  //    "day":"10"
  // }


  var matches = url.match(/xkcd\.com\/([0-9]+)/);

  if (!matches) {
    res.status(400).send('Invalid URL format');
    return;
  }

  var id = matches[1];

  var response;

  try {
    response = sync.await(request({
      url: 'http://xkcd.com/' + id + '/info.0.json',
      gzip: true,
      json: true,
      timeout: 15 * 1000
    }, sync.defer()));
  } catch (e) {
    res.status(500).send('Error');
    return;
  }

  // A non 200 return on the request doesn't throw an error, so we must handle it before sending back to Mixmax
  if (response.statusCode == 200) {
 
    var image = response.body.img;
    var title = response.body.title;
    var alt = response.body.img;

    var html = '<p><b>' + title + '<br><img style="max-width:100%;" src="' + image + '" alt="' + alt + '"/></p>';
    res.json({
      body: html,
      subject: title,
      raw:true
      // This gives the user the ability to change the image width and the title text.
    });
  } else {
    // The throw for a non 200 return is not working on the try/catch loop above,
    // so we need to properly send back the error code to Mixmax, this way users get a nice error message.
    res.status(500).send('Error');
    return;
  }

};