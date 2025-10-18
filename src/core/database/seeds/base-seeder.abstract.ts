export abstract class BaseSeeder {
  abstract name: string;
  
  // Optional method to check if it should run
  async shouldRun(): Promise<boolean> {
    return true;
  }
  
  abstract run(): Promise<void>;
  
  protected log(message: string) {
    console.log(`[SEED] ${this.name}: ${message}`);
  }
}
