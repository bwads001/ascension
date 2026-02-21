export interface TimeSnapshot {
  elapsed: number
  delta: number
  tickCount: number
}

export class TimeManager {
  private startTime = 0
  private lastTime = 0
  private accumulatedTime = 0
  private tickCount = 0
  private paused = false

  constructor(private readonly fixedTimeStep: number = 1000 / 60) {}

  start(): void {
    this.startTime = performance.now()
    this.lastTime = this.startTime
    this.accumulatedTime = 0
    this.tickCount = 0
  }

  update(currentTime: number): number {
    if (this.paused) return 0

    const delta = currentTime - this.lastTime
    this.lastTime = currentTime
    this.accumulatedTime += delta

    return delta
  }

  shouldTick(): boolean {
    return !this.paused && this.accumulatedTime >= this.fixedTimeStep
  }

  consumeTick(): number {
    if (this.accumulatedTime < this.fixedTimeStep) return 0

    this.accumulatedTime -= this.fixedTimeStep
    this.tickCount++

    return this.fixedTimeStep
  }

  getTickCount(): number {
    return this.tickCount
  }

  getFixedTimeStep(): number {
    return this.fixedTimeStep
  }

  getElapsed(): number {
    return performance.now() - this.startTime
  }

  getAlpha(): number {
    return this.accumulatedTime / this.fixedTimeStep
  }

  pause(): void {
    this.paused = true
  }

  resume(): void {
    if (this.paused) {
      this.paused = false
      this.lastTime = performance.now()
    }
  }

  isPaused(): boolean {
    return this.paused
  }

  reset(): void {
    this.startTime = performance.now()
    this.lastTime = this.startTime
    this.accumulatedTime = 0
    this.tickCount = 0
    this.paused = false
  }
}

export const timeManager = new TimeManager()
