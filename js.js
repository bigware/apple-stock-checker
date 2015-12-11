$(document).ready(function() {
	var template = Handlebars.compile($('#device_search_template').html());
	var output = template();
	$('#device_search').html(output);

	$('#device_search').on('change', '.device_search_redo', function() {
		localStorage.clear();

		level = 0;
		while ($('#level' + level).val())
		{
			localStorage.setItem('level' + level, $('#level' + level).val());
			level++;	
		};

		device_search_redo();
	});
	device_search_redo();
	$('#search').click(function() {
		localStorage.setItem('zip_code', $('#zip_code').val());
		device_search();
	}).click();

	$('#device_results').on('click', '.store_info', function() {
		var template = Handlebars.compile($('#store_info_template').html());
		var output = template(current_info.stores[this.dataset.index]);
		$('#store_info').html(output);
		return false;
	});

	(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
	(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
	m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
	})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

	ga('create', 'UA-55080660-1', 'auto');
	ga('send', 'pageview');
});

function device_search_redo(json, level)
{
	if (typeof json === 'undefined')
	{
		$('#device_questions').html('');
		json = devices;
		level = 0;
	}
	else
	{
		level++;
	}

	json.level = level;
	var template = Handlebars.compile($('#device_questions_template').html());
	var output = template(json);
	$('#device_questions').append(output);

	if (localStorage.getItem('level' + level) && json.questions[localStorage.getItem('level' + level)])
	{
		$('#level' + level).val(localStorage.getItem('level' + level));
	}
	else
	{
		localStorage.setItem('level' + level, $('#level' + level).val());
	}

	if (json.questions[localStorage.getItem('level' + level)].question_name)
	{
		device_search_redo(json.questions[localStorage.getItem('level' + level)], level);
	}

	if (localStorage.getItem('zip_code'))
	{
		$('#zip_code').val(localStorage.getItem('zip_code'));
	}
}

function device_search()
{
	$('#error').addClass('hide');
	$('#device_results .panel-body').removeClass('hide');
	$('#device_results table').remove();
	search = find_device_search(devices);
	$.ajax({
		'url': 'https://query.yahooapis.com/v1/public/yql',
		'data': {
			'q': 'SELECT * FROM json WHERE url="http://store.apple.com/us/retailStore/availabilitySearch?' + search_string(search.header) + '&zip=' + $('#zip_code').val() + '&timestamp=' + (new Date()).getTime() + '"',
			'format': 'json',
			'jsonCompat': 'new',
		},
		'dataType': 'jsonp',
		'success': function(response) {
			if (response.query.results.json.body.success === true)
			{
				current_info = response.query.results.json.body;
				current_info.header = search.header;
				var template = Handlebars.compile($('#device_results_template').html());
				var output = template(current_info);
				$('#device_results').append(output);
				$('#device_results .panel-body').addClass('hide');
				if ($('#store_info').html() == '')
				{
					$('.store_info:first').click();
				}
			}
			else
			{
				if (response.query.results.json.body.errorMessage)
				{
					error_message = response.query.results.json.body.errorMessage;
				}
				else
				{
					error_message = 'Unknown Error';
				}

				$('#error_message').text(error_message);
				$('#error').removeClass('hide');
			}
		},
	});
}

function find_device_search(json, level)
{
	if (typeof level === 'undefined')
	{
		level = 0;
	}
	else
	{
		level++;
	}

	if (json.questions[localStorage.getItem('level' + level)].question_name)
	{
		return find_device_search(json.questions[localStorage.getItem('level' + level)], level);
	}
	else
	{
		return json.questions[localStorage.getItem('level' + level)].search;
	}
}

function search_string(header)
{
	var string = '';

	$.each(header, function(index, value){
		if (string != '')
		{
			string += '&';
		}
		string += 'parts.' + index + '=' + value.id;
	});

	return string;
}