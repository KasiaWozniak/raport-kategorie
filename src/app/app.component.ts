import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms'; // Dodaj do obsługi `formControl`
import { forkJoin } from 'rxjs/internal/observable/forkJoin';

@Component({
  selector: 'app-root',
  standalone: true, // W aplikacjach standalone trzeba podać moduły
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [CommonModule, ReactiveFormsModule] // Dodaj wymagane moduły

})
export class AppComponent {
  searchControl = new FormControl('');
  categories: string[] = [];
  products: { [key: string]: any[] } = {}; // Inicjalizacja jako pusty obiekt
  selectedProducts: { [key: string]: any[] } = {}; // Inicjalizacja jako pusty obiekt
  isCategoryExpanded: { [key: string]: boolean } = {}; // Stan rozwinięcia kategorii 

  constructor(private http: HttpClient) {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap((query) => this.fetchCategories(query || ''))
      )
      .subscribe((data) => {
        this.updateCategories(data);
      });
  }

  fetchCategories(query: string) {
    const categoryArray = query.split(',').map((cat) => cat.trim());
    this.categories = categoryArray;
  
    // Pobieranie danych z trzech plików JSON
    return forkJoin([
      this.http.get<any>('assets/json/produktyA.json'),
      this.http.get<any>('assets/json/produktyB.json'),
      this.http.get<any>('assets/json/produktyC.json')
    ]).pipe(
      map(([dataA, dataB, dataC]) => {
        const combinedData = { ...dataA, ...dataB, ...dataC };
        for (const category in combinedData) {
          combinedData[category] = [
            ...(dataA[category] || []),
            ...(dataB[category] || []),
            ...(dataC[category] || [])
          ].filter(
            (item, index, self) =>
              index === self.findIndex((t) => t.nazwa === item.nazwa)
          );
        }
        return combinedData;
      })
    );
  }
  
  

  updateCategories(data: any) {
    this.products = {};
    this.categories.forEach((category) => {
      if (data[category]) {
        this.products[category] = data[category];
      }
    });
  }
  

  toggleCategory(category: string) {
    this.isCategoryExpanded[category] = !this.isCategoryExpanded[category];
  }
  
  toggleCategorySelection(category: string, isChecked: boolean): void {
    if (isChecked) {
      this.selectedProducts[category] = [...this.products[category]];
    } else {
      delete this.selectedProducts[category];
    }
  }
  
  moveProductToMain(category: string, product: any) {
    if (!this.selectedProducts[category]) {
      this.selectedProducts[category] = [];
    }
    if (!this.selectedProducts[category].some((p) => p.nazwa === product.nazwa)) {
      this.selectedProducts[category].push(product);
    }
  }
  
  moveCategoryToMain(category: string) {
    if (!this.selectedProducts[category]) {
      this.selectedProducts[category] = [];
    }
    this.products[category]?.forEach((product) => {
      if (!this.selectedProducts[category].some((p) => p.nazwa === product.nazwa)) {
        this.selectedProducts[category].push(product);
      }
    });
  }
  
  
  getSelectedProductCategories(): string[] {
    return Object.keys(this.selectedProducts);
  }
  
  
}
