import type {
  Firestore,
  WriteBatch,
  DocumentReference,
} from "firebase-admin/firestore";

export class Batch {
  firestore: Firestore;
  private batchArray: WriteBatch[];
  private batchIndex: number;
  private operationCounter: number;
  private batch: WriteBatch;

  constructor(fs: Firestore) {
    this.firestore = fs;
    this.batchArray = [fs.batch()];
    this.batchIndex = 0;
    this.operationCounter = 0;
    this.batch = this.batchArray[this.batchIndex];
  }

  private checkBatch(): void {
    this.operationCounter++;
    if (this.operationCounter >= 200) {
      this.batchIndex++;
      this.batchArray[this.batchIndex] = this.firestore.batch();
      this.batch = this.batchArray[this.batchIndex];
      this.operationCounter = 0;
    }
  }

  update(ref: DocumentReference, obj: Record<string, unknown>): void {
    this.batch.update(ref, obj as FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData>);
    this.checkBatch();
  }

  set(ref: DocumentReference, obj: Record<string, unknown>): void {
    this.batch.set(ref, obj as FirebaseFirestore.WithFieldValue<FirebaseFirestore.DocumentData>);
    this.checkBatch();
  }

  delete(ref: DocumentReference): void {
    this.batch.delete(ref);
    this.checkBatch();
  }

  async write(): Promise<void> {
    await Promise.all(this.batchArray.map((b) => b.commit()));
  }
}
