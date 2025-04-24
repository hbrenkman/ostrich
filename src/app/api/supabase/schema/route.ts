import { NextRequest, NextResponse } from 'next/server';
import { createTable, alterTable, dropTable, createIndex, createView } from '@/lib/supabase-schema';

export async function POST(request: NextRequest) {
  try {
    const { action, ...params } = await request.json();
    
    let result;
    
    switch (action) {
      case 'createTable':
        result = await createTable(params.tableName, params.schema, params.options);
        break;
      case 'alterTable':
        result = await alterTable(params.tableName, params.alterations);
        break;
      case 'dropTable':
        result = await dropTable(params.tableName, params.options);
        break;
      case 'createIndex':
        result = await createIndex(params.tableName, params.columns, params.options);
        break;
      case 'createView':
        result = await createView(params.viewName, params.query, params.options);
        break;
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
    
    if (result.status === 'error') {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in schema API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}