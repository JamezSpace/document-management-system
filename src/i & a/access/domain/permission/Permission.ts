class Permission {
  constructor(private readonly value: string) {}

  public getCode(): string {
    return this.value;
  }

  public equals(other: Permission): boolean {
    return this.value === other.value;
  }
}

export default Permission;