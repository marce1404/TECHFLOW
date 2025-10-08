'use client';

export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  context: SecurityRuleContext;

  constructor(context: SecurityRuleContext) {
    const message = `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:\n${JSON.stringify(
      {
        path: context.path,
        operation: context.operation,
        requestResourceData: context.requestResourceData,
      },
      null,
      2
    )}`;
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;

    // This is to ensure the prototype chain is correctly set up for extending built-in classes.
    Object.setPrototypeOf(this, FirestorePermissionError.prototype);
  }
}
