# stonesOnChessboard
p5.js recreation of the stepping stone puzzle.

![image](https://github.com/Rowan441/stonesOnChessboard/assets/63263642/8c1b1817-a98c-4eb4-b312-33322d898929)


## How to play

The task of the game is to place a series of ordered stones onto an infinite grid.
Stones can only be place on a spot if the sum of its neighbours are equal to the stones value.
In the begining, you may place as many `one` stones as you like anywhere on the grid.
Then you place as many incrementing numbered stones onto the board.

Given `n` starting stones, the highest value stone able to be placed is known for `n < 7`.
See if you can figure out way to place the maximum number of stones!

| 1's placed |  Maximum Score  |
|:-----|:--------:|
| 1   | 1  |
| 2   | 16 |
| 3   | 28 |
| 4   | 38 |
| 5   | 49 |
| 6   | 60 |


### Learn more

To reference optimal solutions and mathematical results regarding the game go to the 
[OEIS page](https://oeis.org/A337663)

For an education video about the game and its mathematical properties see: 
[Numberphile's video with Niel Sloane](https://www.youtube.com/watch?v=m4Uth-EaTZ8)

## About

This project was created with `typescript`, `p5.js` and built / deployed with `parcel` / `GitHub pages`

## Development

To run the project first install the dependencies
```
npm install
```
Then run the project locally:
```
npm run start
```

## Deployment

To push new update from master to gh-pages first build the webapp:

```
npm run build
```

Then push the built files to `deployment-branch`:

```
npx push-dir --dir=dist --branch=deployment-branch
```