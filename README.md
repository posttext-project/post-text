Post Text
=========

> The next generation markup language and word processor

Example
-------

```
Heading
	This is heading

Sub-heading
	This is sub-heading

Paragraph
	Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.

Table [
  sep=none;
  style=square;
]
	Weekday     Food
	---------------------
	Monday      Milk
	Tuesday     Fish
	Wednesday   Sandwick

Chart [text-flow=vertical]
	2015	15%
	2016	20%
	2017	65%
```

Output will look like this:

```html
<h1>This is the heading</h1>

<h2>This is the sub-heading<h2>

<p>
	Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.
</p>

<table>
	<tr>
		<th>Weekday</th>
		<th>Food</th>
	</tr>
	<tr>
		<td>Monday</td>
		<td>Milk</td>
	</tr>
	<tr>
		<td>Tuesday</td>
		<td>Fish</td>
	</tr>
	<tr>
		<td>Wednesday</td>
		<td>Sandwick</td>
	</tr>
</table>

<canvas class="chart"><canvas>
```