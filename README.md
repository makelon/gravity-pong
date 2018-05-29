# Gravity Pong

A one-sided minigame in the most literal sense, with an object that bounces on the edges of a browser window.

### Usage

Include the JavaScript file

```html
<script type="text/javascript" src="gravity-pong.js"></script>
```

Style the elements

```css
.pong-ball {
	width: 20px;
	height: 20px;
	position: fixed;
	border: 10px #686868 solid;
	border-radius: 10px;
	box-sizing: border-box;
}

.pong-pad {
	background-color: #686868;
	position: fixed;
	box-sizing: border-box;
}
```

Run the init function

```js
pongStart({
	maxVelX: 25,
	maxVelY: 35,
	maxCharge: 5,
	gravity: 1,
	padHeight: 100
});
```