import { Point, Direction, GRID_SIZE } from './types';

export class SnakeEngine {
  snake: Point[] = [
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 },
  ];
  direction: Direction = 'UP';
  nextDirection: Direction = 'UP';
  food: Point = { x: 5, y: 5 };
  score: number = 0;
  isGameOver: boolean = false;

  constructor() {
    this.reset();
  }

  reset() {
    this.snake = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ];
    this.direction = 'UP';
    this.nextDirection = 'UP';
    this.score = 0;
    this.isGameOver = false;
    this.spawnFood();
  }

  setDirection(newDir: Direction) {
    const opposites = {
      UP: 'DOWN',
      DOWN: 'UP',
      LEFT: 'RIGHT',
      RIGHT: 'LEFT',
    };
    if (newDir !== opposites[this.direction]) {
      this.nextDirection = newDir;
    }
  }

  spawnFood() {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // Don't spawn food on snake body
      const onSnake = this.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!onSnake) break;
    }
    this.food = newFood;
  }

  update(): boolean {
    if (this.isGameOver) return false;

    this.direction = this.nextDirection;
    const head = { ...this.snake[0] };

    switch (this.direction) {
      case 'UP': head.y -= 1; break;
      case 'DOWN': head.y += 1; break;
      case 'LEFT': head.x -= 1; break;
      case 'RIGHT': head.x += 1; break;
    }

    // Check Wall Collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      this.isGameOver = true;
      return false;
    }

    // Check Self Collision
    if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
      this.isGameOver = true;
      return false;
    }

    this.snake.unshift(head);

    // Check Food Collision
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 10;
      this.spawnFood();
      return true; // Eaten food
    } else {
      this.snake.pop();
      return false;
    }
  }
}
